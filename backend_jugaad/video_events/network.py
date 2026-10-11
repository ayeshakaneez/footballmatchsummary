"""Inference-only RegNet/GSM/BiGRU from jhong93/spot (BSD-3-Clause).

See LICENSE-E2E-SPOT.txt and gsm.py for retained upstream licenses.
Module names intentionally match the published checkpoint exactly.
"""
import math

import timm
import torch
from torch import nn

from .gsm import _GSM


class GatedShift(nn.Module):
    def __init__(self, net, clip_len):
        super().__init__()
        channels = net.conv.in_channels
        self.fold_dim = math.ceil(channels // 4 / 4) * 4
        self.gsm = _GSM(self.fold_dim, clip_len)
        self.net = net

    def forward(self, x):
        shifted = torch.zeros_like(x)
        shifted[:, :self.fold_dim] = self.gsm(x[:, :self.fold_dim])
        shifted[:, self.fold_dim:] = x[:, self.fold_dim:]
        return self.net(shifted)


class FCPrediction(nn.Module):
    def __init__(self, feat_dim, num_classes):
        super().__init__()
        self._fc_out = nn.Linear(feat_dim, num_classes)

    def forward(self, x):
        batch, length, _ = x.shape
        return self._fc_out(x.reshape(batch * length, -1)).view(batch, length, -1)


class GRUPrediction(nn.Module):
    def __init__(self, feat_dim, num_classes):
        super().__init__()
        hidden = min(feat_dim, 768)
        self._gru = nn.GRU(feat_dim, hidden, batch_first=True, bidirectional=True)
        self._fc_out = FCPrediction(2 * hidden, num_classes)
        self._dropout = nn.Dropout()

    def forward(self, x):
        y, _ = self._gru(x)
        return self._fc_out(self._dropout(y))


class SpottingNetwork(nn.Module):
    def __init__(self, config):
        super().__init__()
        if config['temporal_arch'] != 'gru' or config['modality'] != 'rgb' or config['num_classes'] != 17:
            raise ValueError('Expected the published SoccerNet 17-class RGB/GRU checkpoint')
        architectures = {'rny002_gsm': 'regnety_002', 'rny008_gsm': 'regnety_008'}
        name = architectures[config['feature_arch']]
        features = timm.create_model(name, pretrained=False)
        self._feat_dim = features.head.fc.in_features
        features.head.fc = nn.Identity()
        self.clip_len = int(config['clip_len'])
        for stage in (features.s1, features.s2, features.s3, features.s4):
            for block in stage.children():
                block.conv1 = GatedShift(block.conv1, self.clip_len)
        self._features = features
        self._pred_fine = GRUPrediction(self._feat_dim, 18)

    def forward(self, x):
        batch, length, channels, height, width = x.shape
        if length != self.clip_len:
            raise ValueError(f'Expected {self.clip_len} frames, got {length}')
        features = self._features(x.reshape(-1, channels, height, width))
        return self._pred_fine(features.reshape(batch, length, self._feat_dim))
