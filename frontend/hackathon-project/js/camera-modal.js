/**
 * CampusFix - Universal Live Camera & Webcam Capture System
 * Supports front/back camera selection, live video stream preview,
 * snapshot capture to dataURL, and direct integration with Alpine models.
 */
(function () {
  'use strict';

  let currentStream = null;
  let activeCallback = null;
  let currentFacingMode = 'environment'; // default to back camera for issues, user can toggle

  function createModalDOM() {
    if (document.getElementById('cf-camera-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'cf-camera-modal';
    modal.className = 'cf-camera-modal-backdrop';
    modal.style.display = 'none';

    modal.innerHTML = `
      <div class="cf-camera-modal-card" role="dialog" aria-modal="true" aria-labelledby="cf-cam-title">
        <div class="p-4 border-b border-border flex items-center justify-between">
          <div class="flex items-center gap-2">
            <i class="ph-bold ph-camera text-accent text-xl"></i>
            <h3 id="cf-cam-title" class="text-base font-bold text-ink m-0">Live Camera / Webcam Capture</h3>
          </div>
          <button type="button" id="cf-cam-close-btn" class="p-1 rounded-md text-muted hover:text-ink hover:bg-bg transition-colors" aria-label="Close camera">
            <i class="ph-bold ph-x text-lg"></i>
          </button>
        </div>

        <div class="cf-camera-view-container">
          <video id="cf-cam-video" class="cf-camera-video" playsinline autoplay muted></video>
          <canvas id="cf-cam-canvas" class="cf-camera-canvas"></canvas>
          <div class="cf-camera-overlay-grid"></div>
          
          <!-- Camera status / prompt -->
          <div id="cf-cam-loading" class="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4 text-center">
            <i class="ph-bold ph-spinner animate-spin text-3xl mb-2 text-accent"></i>
            <span class="text-sm font-medium">Requesting camera permissions...</span>
          </div>

          <div id="cf-cam-error" class="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white p-6 text-center" style="display: none;">
            <i class="ph-bold ph-warning-circle text-3xl mb-2 text-red-400"></i>
            <span class="text-sm font-medium mb-1">Camera Access Blocked or Not Found</span>
            <p class="text-xs text-gray-300 max-w-xs mb-3">Please allow camera permissions in your browser or use the standard file upload button.</p>
            <button type="button" id="cf-cam-retry-btn" class="btn btn-secondary text-xs py-1.5 px-3">Try Again</button>
          </div>
        </div>

        <!-- Camera Controls Toolbar -->
        <div class="p-4 bg-surface border-t border-border flex items-center justify-between gap-3">
          <!-- Flip Camera Switch (Environment vs User) -->
          <button type="button" id="cf-cam-flip-btn" class="btn btn-secondary text-xs py-2 px-3 inline-flex items-center gap-1.5" title="Flip front / back camera">
            <i class="ph-bold ph-arrows-clockwise text-base"></i>
            <span class="hidden sm:inline">Flip Cam</span>
          </button>

          <!-- Shutter Button -->
          <div class="flex flex-col items-center">
            <button type="button" id="cf-cam-shutter-btn" class="cf-camera-btn-record" title="Capture Photo">
              <i class="ph-fill ph-camera"></i>
            </button>
            <span class="text-[10px] text-muted font-bold tracking-wider uppercase mt-1">Capture</span>
          </div>

          <!-- Cancel / Close -->
          <button type="button" id="cf-cam-cancel-btn" class="btn btn-ghost text-xs py-2 px-3">
            Cancel
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners for close
    document.getElementById('cf-cam-close-btn').addEventListener('click', closeCamera);
    document.getElementById('cf-cam-cancel-btn').addEventListener('click', closeCamera);
    document.getElementById('cf-cam-retry-btn').addEventListener('click', () => startCamera(currentFacingMode));
    
    // Switch front / back camera
    document.getElementById('cf-cam-flip-btn').addEventListener('click', () => {
      currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
      startCamera(currentFacingMode);
    });

    // Capture snapshot
    document.getElementById('cf-cam-shutter-btn').addEventListener('click', captureSnapshot);
  }

  function startCamera(facingMode = 'environment') {
    const modal = document.getElementById('cf-camera-modal');
    const video = document.getElementById('cf-cam-video');
    const loading = document.getElementById('cf-cam-loading');
    const errorBox = document.getElementById('cf-cam-error');

    modal.style.display = 'flex';
    loading.style.display = 'flex';
    errorBox.style.display = 'none';

    // Stop existing tracks if any
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
      currentStream = null;
    }

    const constraints = {
      video: {
        facingMode: { ideal: facingMode },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    };

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      loading.style.display = 'none';
      errorBox.style.display = 'flex';
      return;
    }

    navigator.mediaDevices.getUserMedia(constraints)
      .then(stream => {
        currentStream = stream;
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          video.play();
          loading.style.display = 'none';
        };
      })
      .catch(err => {
        console.warn('Camera error:', err);
        loading.style.display = 'none';
        errorBox.style.display = 'flex';
      });
  }

  function captureSnapshot() {
    const video = document.getElementById('cf-cam-video');
    const canvas = document.getElementById('cf-cam-canvas');
    if (!video || !video.videoWidth) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // If user facing camera, flip horizontally for mirror selfie effect
    if (currentFacingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

    closeCamera();

    if (typeof activeCallback === 'function') {
      activeCallback(dataUrl);
    }
  }

  function closeCamera() {
    const modal = document.getElementById('cf-camera-modal');
    if (modal) modal.style.display = 'none';

    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
      currentStream = null;
    }
  }

  // Public API exposed on window
  window.CampusFixCamera = {
    open: function (callback, defaultFacing = 'environment') {
      createModalDOM();
      activeCallback = callback;
      currentFacingMode = defaultFacing;
      startCamera(currentFacingMode);
    },
    close: closeCamera
  };

  // Pre-create modal DOM on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createModalDOM);
  } else {
    createModalDOM();
  }
})();
