document.addEventListener('DOMContentLoaded', () => {
    const API_URL = "127.0.0.1:8000";
    const username = localStorage.getItem('username');
    let ws = null;
    let peerConnection = null;
    let dataChannel = null;

    // Inject Modals Globally if missing
    if (!document.getElementById('p2p-receive-modal')) {
        const modalsHtml = `
  <!-- P2P Receive Modal -->
  <div class="modal-overlay" id="p2p-receive-modal">
    <div class="modal-content upload-modal-content" style="width:400px; padding-top:40px; text-align:center;">
      <i class="fa-solid fa-bolt" style="font-size:40px; color:#10b981; margin-bottom:15px;"></i>
      <h3 style="margin-bottom:8px; font-weight:700;">Incoming File Transfer</h3>
      <p style="font-size:13px; color:var(--text-muted); margin-bottom:20px;" id="p2p-sender-text">Someone wants to send you a file.</p>
      
      <div style="display:flex; gap:10px; justify-content:center;" id="p2p-action-buttons">
        <button class="btn-primary" id="accept-p2p-btn" style="background:#10b981; flex:1;">Accept</button>
        <button class="btn-primary" id="reject-p2p-btn" style="background:#ef4444; flex:1;">Reject</button>
      </div>
      
      <div class="upload-progress" id="p2p-receive-progress" style="display:none; margin-top:20px;">
        <div class="progress-bar"><div class="progress-fill" id="p2p-receive-fill"></div></div>
        <span id="p2p-receive-pct">0%</span>
        <div id="p2p-receive-status" style="font-size:12px; color:var(--text-muted); margin-top:8px;">Transferring...</div>
      </div>
    </div>
  </div>

  <!-- Guest Upgrade Modal -->
  <div class="modal-overlay" id="guest-upgrade-modal">
    <div class="modal-content upload-modal-content" style="width:400px; padding-top:40px;">
      <button class="modal-close-btn" id="close-guest-upgrade-modal"><i class="fa-solid fa-xmark"></i></button>
      <div style="text-align:center;">
        <i class="fa-solid fa-star" style="font-size:40px; color:#f59e0b; margin-bottom:15px;"></i>
        <h3 style="margin-bottom:8px; font-weight:700;">File Sent Successfully!</h3>
        <p style="font-size:13px; color:var(--text-muted); margin-bottom:20px;">You are currently using a temporary Guest Account. Upgrade to a full account to save your files permanently, add friends, and claim a personalized username!</p>
        <button class="btn-primary" onclick="window.location.href='../Signup page/index.html'" style="width:100%; margin-top:10px; height:45px; justify-content:center; display:flex; background: linear-gradient(135deg, #d946ef, #a855f7);">
          <i class="fa-solid fa-user-plus"></i> Create Full Account
        </button>
        <button id="dismiss-upgrade-btn" style="background:transparent; border:none; color:var(--text-muted); font-size:12px; margin-top:15px; cursor:pointer; text-decoration:underline;">
          Maybe Later
        </button>
      </div>
    </div>
  </div>`;
        document.body.insertAdjacentHTML('beforeend', modalsHtml);
        
        // Bind guest modal closing logic inline since script.js might load out-of-order on some pages
        const guestUpgradeModal = document.getElementById('guest-upgrade-modal');
        if (guestUpgradeModal) {
            const closeUpgradeModal = () => guestUpgradeModal.classList.remove('active');
            document.getElementById('close-guest-upgrade-modal')?.addEventListener('click', closeUpgradeModal);
            document.getElementById('dismiss-upgrade-btn')?.addEventListener('click', closeUpgradeModal);
        }
    }

    // UI elements
    const receiveModal = document.getElementById('p2p-receive-modal');
    const acceptBtn = document.getElementById('accept-p2p-btn');
    const rejectBtn = document.getElementById('reject-p2p-btn');
    const receiveProgress = document.getElementById('p2p-receive-progress');
    const receiveFill = document.getElementById('p2p-receive-fill');
    const receivePct = document.getElementById('p2p-receive-pct');
    const senderText = document.getElementById('p2p-sender-text');
    
    // WebRTC config
    const configuration = {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };

    let incomingOffer = null;
    let currentSender = null;
    let receivedBuffers = [];
    let receivedSize = 0;
    let expectedFileSize = 0;
    let expectedFileName = "";
    
    if (username) {
        // Connect WebSocket
        ws = new WebSocket(`ws://${API_URL}/ws/${encodeURIComponent(username)}`);
        
        ws.onopen = () => {
            console.log("WebSocket connected for signaling");
        };

        ws.onmessage = async (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'transfer-request') {
                // Incoming file transfer request
                currentSender = data.sender;
                expectedFileName = data.payload.fileName;
                expectedFileSize = data.payload.fileSize;
                
                senderText.textContent = `${currentSender} wants to send you '${expectedFileName}' (${(expectedFileSize / (1024*1024)).toFixed(2)} MB).`;
                receiveModal.classList.add('active');
                
            } else if (data.type === 'transfer-accept') {
                // Sender's request was accepted, create offer
                createOffer(data.sender);
                
            } else if (data.type === 'transfer-reject') {
                // Sender's request was rejected
                showToastError(`${data.sender} declined your transfer.`);
                cleanupP2P();
                
            } else if (data.type === 'offer') {
                // Receiver gets offer, create answer
                incomingOffer = data.payload;
                handleOffer(incomingOffer, data.sender);
            } else if (data.type === 'answer') {
                // Sender gets answer
                await peerConnection.setRemoteDescription(new RTCSessionDescription(data.payload));
            } else if (data.type === 'ice-candidate') {
                // Both get ICE candidates
                if (peerConnection) {
                    try {
                        await peerConnection.addIceCandidate(data.payload);
                    } catch (e) { console.error('Error adding received ice candidate', e); }
                }
            }
        };
    }

    // Export function to start transfer
    window.startP2PTransfer = function(targetUsername, files) {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            alert("WebSocket not connected. Please refresh.");
            return;
        }
        if (files.length === 0) return;
        
        const file = files[0]; // for now support one file
        window.p2pFileToSend = file; // Store for later
        
        // Ask target if they want to accept
        ws.send(JSON.stringify({
            target: targetUsername,
            type: 'transfer-request',
            payload: {
                fileName: file.name,
                fileSize: file.size
            }
        }));
        
        // Show progress UI locally
        const uploadProgress = document.getElementById('upload-progress');
        const progressText = document.getElementById('progress-text');
        const progressFill = document.getElementById('progress-fill');
        if (uploadProgress) uploadProgress.style.display = 'block';
        if (progressText) progressText.textContent = "Waiting for acceptance...";
        if (progressFill) progressFill.style.width = '0%';
    };

    function sendSignalingMessage(target, type, payload) {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ target, type, payload }));
        }
    }

    function createPeerConnection(targetUsername) {
        peerConnection = new RTCPeerConnection(configuration);
        
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                sendSignalingMessage(targetUsername, 'ice-candidate', event.candidate);
            }
        };
        
        peerConnection.onconnectionstatechange = () => {
            console.log("Connection state:", peerConnection.connectionState);
            if (peerConnection.connectionState === 'disconnected' || peerConnection.connectionState === 'failed') {
                cleanupP2P();
            }
        };
    }

    // Sender creating offer
    async function createOffer(targetUsername) {
        createPeerConnection(targetUsername);
        
        dataChannel = peerConnection.createDataChannel("fileTransfer");
        setupDataChannel(dataChannel, true); // true = sender
        
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        sendSignalingMessage(targetUsername, 'offer', offer);
    }

    // Receiver handling offer
    async function handleOffer(offer, targetUsername) {
        createPeerConnection(targetUsername);
        
        peerConnection.ondatachannel = (event) => {
            dataChannel = event.channel;
            setupDataChannel(dataChannel, false); // false = receiver
        };
        
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        sendSignalingMessage(targetUsername, 'answer', answer);
    }

    function setupDataChannel(channel, isSender) {
        channel.binaryType = 'arraybuffer';
        
        channel.onopen = () => {
            console.log("Data channel open. isSender:", isSender);
            if (isSender) {
                sendFile();
            }
        };
        
        channel.onmessage = (event) => {
            if (typeof event.data === 'string') {
                if (event.data === 'EOF') {
                    // File transfer complete
                    saveReceivedFile();
                }
            } else {
                // Binary chunk
                receivedBuffers.push(event.data);
                receivedSize += event.data.byteLength;
                
                const pct = Math.round((receivedSize / expectedFileSize) * 100);
                if (receiveProgress) receiveProgress.style.display = 'block';
                if (receiveFill) receiveFill.style.width = pct + '%';
                if (receivePct) receivePct.textContent = pct + '%';
            }
        };
    }

    function sendFile() {
        const file = window.p2pFileToSend;
        if (!file) return;
        
        const CHUNK_SIZE = 64 * 1024; // 64 KB
        let offset = 0;
        
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        
        const fileReader = new FileReader();
        fileReader.onload = (e) => {
            if (dataChannel.readyState !== 'open') return;
            
            dataChannel.send(e.target.result);
            offset += e.target.result.byteLength;
            
            const pct = Math.round((offset / file.size) * 100);
            if (progressFill) progressFill.style.width = pct + '%';
            if (progressText) progressText.textContent = `Sending... ${pct}%`;
            
            if (offset < file.size) {
                readSlice(offset);
            } else {
                dataChannel.send('EOF');
                if (progressText) progressText.textContent = "Sent successfully!";
                setTimeout(() => {
                    cleanupP2P();
                    if (localStorage.getItem('isGuest') === 'true') {
                        const m = document.getElementById('guest-upgrade-modal');
                        if (m) m.classList.add('active');
                    }
                }, 2000);
            }
        };
        
        const readSlice = (o) => {
            const slice = file.slice(o, o + CHUNK_SIZE);
            fileReader.readAsArrayBuffer(slice);
        };
        
        readSlice(0);
    }
    
    function saveReceivedFile() {
        const blob = new Blob(receivedBuffers);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = expectedFileName || 'received_file';
        document.body.appendChild(a);
        a.click();
        
        // Cleanup document
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 1000);
        
        if (receivePct) receivePct.textContent = "Completed!";
        setTimeout(() => {
            receiveModal.classList.remove('active');
            // reset action buttons back to flex for next time
            const p2pBtns = document.getElementById('p2p-action-buttons');
            if (p2pBtns) p2pBtns.style.display = 'flex';
            if (receiveProgress) receiveProgress.style.display = 'none';
            cleanupP2P();
            
            if (localStorage.getItem('isGuest') === 'true') {
                const m = document.getElementById('guest-upgrade-modal');
                if (m) m.classList.add('active');
            }
        }, 2000);
    }

    function cleanupP2P() {
        if (dataChannel) { dataChannel.close(); dataChannel = null; }
        if (peerConnection) { peerConnection.close(); peerConnection = null; }
        incomingOffer = null;
        currentSender = null;
        receivedBuffers = [];
        receivedSize = 0;
        window.p2pFileToSend = null;
        
        // Hide upload progress
        const uploadProgress = document.getElementById('upload-progress');
        if (uploadProgress) uploadProgress.style.display = 'none';
        
        // Reset modal state
        if (receiveModal) receiveModal.classList.remove('active');
        const p2pBtns = document.getElementById('p2p-action-buttons');
        if (p2pBtns) p2pBtns.style.display = 'flex';
        if (receiveProgress) receiveProgress.style.display = 'none';
    }

    if (acceptBtn) {
        acceptBtn.addEventListener('click', () => {
            if (currentSender) {
                sendSignalingMessage(currentSender, 'transfer-accept', {});
                document.getElementById('p2p-action-buttons').style.display = 'none';
                if (receiveProgress) receiveProgress.style.display = 'block';
            }
        });
    }

    if (rejectBtn) {
        rejectBtn.addEventListener('click', () => {
            if (currentSender) {
                sendSignalingMessage(currentSender, 'transfer-reject', {});
            }
            cleanupP2P();
        });
    }

    function showToastError(msg) {
        // Find existing toast container or create one
        const toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast error slideIn`;
        toast.innerHTML = `
          <div class="toast-icon error"><i class="fa-solid fa-exclamation-triangle"></i></div>
          <div class="toast-content">
            <div class="toast-title">P2P Error</div>
            <div class="toast-message">${msg}</div>
          </div>
        `;
        toastContainer.appendChild(toast);
        setTimeout(() => {
          toast.classList.add('slideOut');
          setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

});
