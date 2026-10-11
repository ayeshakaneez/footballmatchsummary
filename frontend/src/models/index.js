export class MatchHighlight {
  constructor(data) {
    this.time = data.time || '';
    this.title = data.title || '';
    this.player = data.player || '';
    this.type = data.type || '';
    this.team = data.team;
    this.isAI = data.isAI || false;
    this.probability = data.probability;
    this.description = data.description || '';
    this.scoreHome = data.scoreHome || 0;
    this.scoreAway = data.scoreAway || 0;
    this.teamHome = data.teamHome || '';
    this.teamAway = data.teamAway || '';
    this.stats = data.stats || [];
    this.relatedHighlights = data.relatedHighlights || [];
  }

  static fromJson(json) {
    return new MatchHighlight(json);
  }
}

export class AIPrediction {
  constructor(data) {
    this.matchId = data.matchId || '';
    this.homeTeam = data.homeTeam || '';
    this.awayTeam = data.awayTeam || '';
    this.homeLogo = data.homeLogo || '';
    this.awayLogo = data.awayLogo || '';
    this.homeWinProb = (data.homeWinProb || 0) * 1;
    this.drawProb = (data.drawProb || 0) * 1;
    this.awayWinProb = (data.awayWinProb || 0) * 1;
    this.tacticalInsight = data.tacticalInsight || '';
    this.league = data.league || '';
    this.matchTime = data.matchTime ? new Date(data.matchTime) : new Date();
  }

  static fromJson(json) {
    return new AIPrediction(json);
  }
}

export class MatchEvent {
  constructor(data) {
    this.type = data.type || '';
    this.time = data.time || '';
    this.player = data.player || '';
    this.detail = data.detail;
  }

  static fromJson(json) {
    return new MatchEvent(json);
  }
}