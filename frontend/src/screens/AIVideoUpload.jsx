import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppColors, FontFamily } from '../theme';
import { uploadVideo } from '../services/api';

const AIVideoUpload = () => {
  const navigate = useNavigate();
  const uploadController = useRef(null);
  useEffect(() => () => uploadController.current?.abort(), []);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileSize, setFileSize] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [uploadedResult, setUploadedResult] = useState(null);
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileSize(file.size);
      setUploadComplete(false);
      setErrorMsg('');
      setUploadedResult(null);
    }
  };

  const startUpload = async () => {
    if (!selectedFile) return;
    if (!/\.(mp4|mov|avi|mkv)$/i.test(selectedFile.name) || selectedFile.size > 2 * 1024 ** 3) {
      setErrorMsg('Choose an MP4, MOV, AVI or MKV video no larger than 2 GB.');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    setErrorMsg('');

    try {
      // Upload video to backend
      uploadController.current = new AbortController();
      const data = await uploadVideo(selectedFile, setUploadProgress, uploadController.current.signal);
      setUploadedResult(data);

      setUploadProgress(1);
      setIsUploading(false);
      setUploadComplete(true);

    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error('Upload error:', error);
      setIsUploading(false);
      setUploadProgress(0);
      setErrorMsg(error.message || 'Upload failed. Is the Python server running?');
    }
  };

  const handleGenerateSummary = () => {
    // Pass the file name, job_id, and uploaded video info to the processing screen
    const targetVideoPath = uploadedResult?.job_id || uploadedResult?.filename || uploadedResult?.path || selectedFile?.name || 'video.mp4';
    navigate('/processing', { 
      state: { 
        fileName: selectedFile?.name || 'video.mp4',
        videoPath: targetVideoPath,
        jobId: uploadedResult?.job_id,
        uploadResult: uploadedResult,
      } 
    });
  };

  const cancelUpload = () => {
    uploadController.current?.abort();
    setIsUploading(false);
    setUploadProgress(0);
    setSelectedFile(null);
    setUploadComplete(false);
    setErrorMsg('');
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backButton} onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={AppColors.textPrimary} strokeWidth="2">
            <path d="M15 18l-6-6 6-6"></path>
          </svg>
        </button>
        <p style={styles.headerTitle}>New Analysis</p>
        <div style={{ width: '40px' }} />
      </div>

      <div style={styles.content}>
        <div style={styles.titleSection}>
          <h1 style={styles.title}>Match Upload</h1>
          <p style={styles.subtitle}>Prepare your video for AI tactical analysis.</p>
        </div>

        {!isUploading && !uploadComplete && (
          <div style={styles.uploadZone}>
            <div style={styles.uploadIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={AppColors.primary} strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>
            <p style={styles.uploadTitle}>Upload match video</p>
            <p style={styles.uploadDesc}>
              Tap here to select a football match video from your library.
            </p>
            <input
              type="file"
              accept=".mp4,.mov,.avi,.mkv"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="video-upload"
            />
            <label htmlFor="video-upload" style={styles.selectButton}>
              Select Video
            </label>
            {selectedFile && (
              <div style={{ marginTop: '12px' }}>
                <p style={{ ...styles.fileInfo, color: AppColors.primary, fontWeight: '600' }}>
                  ✓ {selectedFile.name} ({(fileSize / (1024 * 1024)).toFixed(1)} MB)
                </p>
                <button 
                  style={styles.uploadButton}
                  onClick={startUpload}
                >
                  Start Upload
                </button>
              </div>
            )}
            <p style={styles.fileTypes}>MP4, MOV up to 2GB</p>
          </div>
        )}

        {isUploading && (
          <div style={styles.progressCard}>
            <p style={styles.progressTitle}>Upload Progress</p>
            <div style={styles.progressFile}>
              <div style={styles.fileIconBox}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={AppColors.primary} strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect>
                  <line x1="7" y1="2" x2="7" y2="22"></line>
                  <line x1="17" y1="2" x2="17" y2="22"></line>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                </svg>
              </div>
              <div style={styles.fileInfo}>
                <p style={styles.fileName}>{selectedFile?.name || 'video.mp4'}</p>
                <p style={styles.fileSizeText}>
                  {selectedFile ? `${(fileSize / (1024 * 1024)).toFixed(2)} MB` : '0 MB'}
                </p>
              </div>
              <button style={styles.cancelButton} onClick={cancelUpload}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9e9e9e" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div style={styles.progressStatus}>
              <span>Uploading to AI Engine...</span>
              <span>{Math.round(uploadProgress * 100)}%</span>
            </div>
            <div style={styles.progressBar}>
              <div style={{...styles.progressFill, width: `${uploadProgress * 100}%`}} />
            </div>
          </div>
        )}

        {uploadComplete && (
          <div style={styles.successCard}>
            <div style={styles.successIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={AppColors.primary} strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <p style={styles.successTitle}>Upload Complete!</p>
            <p style={styles.successDesc}>{selectedFile?.name} is ready for AI analysis.</p>
          </div>
        )}

        {errorMsg && (
          <div style={styles.errorCard}>
            <p style={styles.errorText}>⚠️ {errorMsg}</p>
          </div>
        )}

        <p>After upload, identify the two teams from detected player images.</p>

        <div style={styles.infoAlert}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2196F3" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <p style={styles.infoText}>
            Processing time depends on video length and your hardware. Keep the analysis page open to confirm teams and view results.
          </p>
        </div>
      </div>

        {uploadComplete && (
          <div style={styles.bottomCTA}>
            <button 
              style={styles.generateButton}
              onClick={handleGenerateSummary}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={AppColors.textPrimary} strokeWidth="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
              </svg>
              Generate Summary
            </button>
            <p style={styles.terms}>By proceeding, you agree to our Terms of Service</p>
          </div>
        )}

        {isUploading && (
          <div style={styles.bottomCTA}>
            <p style={styles.terms}>Uploading... {Math.round(uploadProgress * 100)}%</p>
          </div>
        )}
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: AppColors.backgroundLight,
    minHeight: '100vh',
    fontFamily: FontFamily,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
  },
  backButton: {
    width: '40px',
    height: '40px',
    backgroundColor: AppColors.white,
    borderRadius: '50%',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  headerTitle: {
    fontFamily: FontFamily,
    fontSize: '18px',
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    margin: 0,
  },
  content: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
  },
  titleSection: {
    marginBottom: '24px',
  },
  title: {
    fontFamily: FontFamily,
    fontSize: '24px',
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    marginBottom: '4px',
  },
  subtitle: {
    fontFamily: FontFamily,
    fontSize: '14px',
    color: '#757575',
  },
  uploadZone: {
    padding: '32px 16px',
    backgroundColor: `${AppColors.white}80`,
    border: `2px dashed ${AppColors.primary}66`,
    borderRadius: '16px',
    textAlign: 'center',
  },
  uploadIcon: {
    width: '64px',
    height: '64px',
    backgroundColor: `${AppColors.primary}1A`,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  uploadTitle: {
    fontFamily: FontFamily,
    fontSize: '18px',
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    marginBottom: '8px',
  },
  uploadDesc: {
    fontFamily: FontFamily,
    fontSize: '14px',
    color: '#757575',
    marginBottom: '20px',
    padding: '0 20px',
  },
  selectButton: {
    display: 'inline-block',
    height: '48px',
    padding: '0 24px',
    backgroundColor: AppColors.primary,
    borderRadius: '24px',
    fontFamily: FontFamily,
    fontSize: '14px',
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    cursor: 'pointer',
    lineHeight: '48px',
  },
  fileInfo: {
    fontFamily: FontFamily,
    fontSize: '14px',
    color: AppColors.primary,
    marginTop: '12px',
  },
  fileTypes: {
    fontFamily: FontFamily,
    fontSize: '10px',
    fontWeight: '600',
    letterSpacing: '2px',
    color: '#bdbdbd',
    marginTop: '12px',
  },
  uploadButton: {
    width: '100%',
    height: '48px',
    backgroundColor: AppColors.primary,
    borderRadius: '24px',
    fontFamily: FontFamily,
    fontSize: '16px',
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    border: 'none',
    cursor: 'pointer',
    marginTop: '16px',
  },
  progressCard: {
    backgroundColor: AppColors.white,
    borderRadius: '16px',
    padding: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  progressTitle: {
    fontFamily: FontFamily,
    fontSize: '16px',
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    marginBottom: '16px',
  },
  progressFile: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  fileIconBox: {
    width: '48px',
    height: '48px',
    backgroundColor: `${AppColors.primary}1A`,
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileName: {
    fontFamily: FontFamily,
    fontSize: '14px',
    fontWeight: '600',
    color: AppColors.textPrimary,
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  fileSizeText: {
    fontFamily: FontFamily,
    fontSize: '12px',
    fontWeight: '500',
    color: AppColors.primary,
  },
  cancelButton: {
    width: '32px',
    height: '32px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
  },
  progressStatus: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  progressBar: {
    height: '8px',
    backgroundColor: '#e0e0e0',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: AppColors.primary,
    transition: 'width 0.15s ease',
  },
  successCard: {
    backgroundColor: AppColors.white,
    borderRadius: '16px',
    padding: '32px 16px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  successIcon: {
    width: '72px',
    height: '72px',
    backgroundColor: `${AppColors.primary}1A`,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  successTitle: {
    fontFamily: FontFamily,
    fontSize: '20px',
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    marginBottom: '8px',
  },
  successDesc: {
    fontFamily: FontFamily,
    fontSize: '14px',
    color: '#757575',
  },
  errorCard: {
    backgroundColor: '#FFF3F0',
    borderRadius: '12px',
    padding: '16px',
    marginTop: '16px',
    border: '1px solid #FFCDD2',
  },
  errorText: {
    fontFamily: FontFamily,
    fontSize: '13px',
    color: '#D32F2F',
    margin: 0,
  },
  infoAlert: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    backgroundColor: 'rgba(33, 150, 243, 0.05)',
    borderRadius: '12px',
    padding: '16px',
    marginTop: '24px',
  },
  infoText: {
    fontFamily: FontFamily,
    fontSize: '12px',
    color: '#2196F3',
  },
  bottomCTA: {
    padding: '20px',
    background: `linear-gradient(to top, ${AppColors.backgroundLight}, transparent, transparent)`,
  },
  generateButton: {
    height: '56px',
    backgroundColor: AppColors.primary,
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    border: 'none',
    cursor: 'pointer',
    boxShadow: `0 0 12px ${AppColors.primary}33`,
    fontFamily: FontFamily,
    fontSize: '16px',
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  terms: {
    fontFamily: FontFamily,
    fontSize: '11px',
    color: '#bdbdbd',
    textAlign: 'center',
    marginTop: '12px',
  },
  teamsCard: {
    backgroundColor: AppColors.cardBackground || '#ffffff',
    borderRadius: '16px',
    padding: '18px',
    marginTop: '20px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
    border: '1px solid #edf2f7',
  },
  teamsHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '6px',
  },
  teamsTitle: {
    fontFamily: FontFamily,
    fontSize: '13px',
    fontWeight: '700',
    color: AppColors.textPrimary,
    letterSpacing: '0.5px',
  },
  teamsBadge: {
    fontSize: '11px',
    fontWeight: '600',
    color: AppColors.primary,
    backgroundColor: `${AppColors.primary}18`,
    padding: '3px 8px',
    borderRadius: '12px',
  },
  teamsSubtitle: {
    fontFamily: FontFamily,
    fontSize: '12px',
    color: '#757575',
    margin: '0 0 14px 0',
  },
  teamsInputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  teamInputGroup: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  teamLabel: {
    fontFamily: FontFamily,
    fontSize: '11px',
    fontWeight: '600',
    color: '#616161',
    textTransform: 'uppercase',
  },
  teamInput: {
    fontFamily: FontFamily,
    fontSize: '14px',
    fontWeight: '500',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid #e0e0e0',
    outline: 'none',
    backgroundColor: '#fafafa',
    color: AppColors.textPrimary,
    boxSizing: 'border-box',
    width: '100%',
  },
  teamsVsBadge: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#9e9e9e',
    marginTop: '18px',
    padding: '4px 6px',
    borderRadius: '6px',
    backgroundColor: '#f5f5f5',
  },
};

export default AIVideoUpload;