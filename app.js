// BT Image Processor - Main Application JavaScript

// Global Variables
let selectedFiles = [];
let processingQueue = [];
let processingHistory = [];
let dataTable = null;
let processingChart = null;
let formatChart = null;

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    initializeCharts();
    initializeDataTable();
    loadHistoryFromStorage();
    updateStatistics();
    setupSmoothScrolling();
}

// Event Listeners
function setupEventListeners() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const processBtn = document.getElementById('processBtn');
    const qualitySlider = document.getElementById('qualitySlider');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');

    // Upload Area Click
    uploadArea.addEventListener('click', () => fileInput.click());

    // File Input Change
    fileInput.addEventListener('change', handleFileSelect);

    // Drag and Drop
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);

    // Process Button
    processBtn.addEventListener('click', processImages);

    // Quality Slider
    qualitySlider.addEventListener('input', function() {
        document.getElementById('qualityValue').textContent = this.value;
    });

    // Clear History Button
    clearHistoryBtn.addEventListener('click', clearHistory);
}

// File Handling Functions
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    addFilesToQueue(files);
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
        file.type.startsWith('image/')
    );
    
    if (files.length === 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Invalid Files',
            text: 'Please drop only image files',
            confirmButtonColor: '#75F9BD'
        });
        return;
    }
    
    addFilesToQueue(files);
}

function addFilesToQueue(files) {
    files.forEach(file => {
        if (!selectedFiles.find(f => f.name === file.name && f.size === file.size)) {
            selectedFiles.push(file);
        }
    });
    
    renderFilePreview();
    updateProcessButton();
    
    Swal.fire({
        icon: 'success',
        title: 'Files Added',
        text: `${files.length} file(s) added to queue`,
        timer: 2000,
        showConfirmButton: false
    });
}

function renderFilePreview() {
    const previewContainer = document.getElementById('filePreview');
    previewContainer.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const previewItem = document.createElement('div');
            previewItem.className = 'file-preview-item fade-in';
            previewItem.innerHTML = `
                <img src="${e.target.result}" alt="${file.name}">
                <div class="filename" title="${file.name}">${file.name}</div>
                <button class="remove-btn" onclick="removeFile(${index})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            previewContainer.appendChild(previewItem);
        };
        
        reader.readAsDataURL(file);
    });
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    renderFilePreview();
    updateProcessButton();
}

function updateProcessButton() {
    const processBtn = document.getElementById('processBtn');
    processBtn.disabled = selectedFiles.length === 0;
}

// Image Processing Functions
async function processImages() {
    if (selectedFiles.length === 0) return;
    
    const options = getProcessingOptions();
    
    // Show confirmation
    const result = await Swal.fire({
        icon: 'question',
        title: 'Process Images?',
        text: `Process ${selectedFiles.length} image(s) with selected options?`,
        showCancelButton: true,
        confirmButtonText: 'Yes, Process',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#75F9BD',
        cancelButtonColor: '#6c757d'
    });
    
    if (!result.isConfirmed) return;
    
    // Show processing notification
    Swal.fire({
        icon: 'info',
        title: 'Processing Images',
        text: 'Your images are being processed...',
        timer: 2000,
        showConfirmButton: false
    });
    
    // Clear queue display
    const queueContainer = document.getElementById('queueContainer');
    queueContainer.innerHTML = '';
    
    // Process each file
    for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        await processImage(file, options, i);
    }
    
    // Show completion
    Swal.fire({
        icon: 'success',
        title: 'Processing Complete!',
        text: `Successfully processed ${selectedFiles.length} image(s)`,
        confirmButtonColor: '#75F9BD'
    });
    
    // Clear selected files
    selectedFiles = [];
    renderFilePreview();
    updateProcessButton();
    
    // Update statistics and charts
    updateStatistics();
    updateCharts();
}

async function processImage(file, options, index) {
    const queueItem = createQueueItem(file, index);
    document.getElementById('queueContainer').appendChild(queueItem);
    
    // Simulate processing with progress
    const progressBar = queueItem.querySelector('.progress-bar');
    const statusBadge = queueItem.querySelector('.queue-status');
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress > 100) progress = 100;
        progressBar.style.width = progress + '%';
        progressBar.textContent = Math.round(progress) + '%';
    }, 200);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1500));
    
    clearInterval(interval);
    progressBar.style.width = '100%';
    progressBar.textContent = '100%';
    statusBadge.textContent = 'Completed';
    statusBadge.classList.remove('processing');
    statusBadge.classList.add('completed');
    
    // Add to history
    const historyItem = {
        timestamp: new Date().toISOString(),
        filename: file.name,
        originalSize: file.size,
        processedSize: Math.round(file.size * (0.5 + Math.random() * 0.3)),
        format: options.format === 'original' ? getFileExtension(file.name) : options.format,
        status: 'Success',
        options: options
    };
    
    processingHistory.push(historyItem);
    saveHistoryToStorage();
    addHistoryRow(historyItem);
}

function createQueueItem(file, index) {
    const queueItem = document.createElement('div');
    queueItem.className = 'queue-item fade-in';
    queueItem.innerHTML = `
        <div class="queue-item-header">
            <span class="queue-item-title">
                <i class="fas fa-image me-2"></i>${file.name}
            </span>
            <span class="queue-status processing">Processing</span>
        </div>
        <div class="progress">
            <div class="progress-bar" role="progressbar" style="width: 0%">0%</div>
        </div>
        <small class="text-muted mt-2 d-block">Size: ${formatBytes(file.size)}</small>
    `;
    return queueItem;
}

function getProcessingOptions() {
    return {
        resize: document.getElementById('resizeOption').value,
        format: document.getElementById('formatOption').value,
        quality: document.getElementById('qualitySlider').value,
        filter: document.getElementById('filterOption').value
    };
}

// Statistics Functions
function updateStatistics() {
    const totalImages = processingHistory.length;
    const totalOriginalSize = processingHistory.reduce((sum, item) => sum + item.originalSize, 0);
    const totalProcessedSize = processingHistory.reduce((sum, item) => sum + item.processedSize, 0);
    const spaceSaved = totalOriginalSize - totalProcessedSize;
    const avgProcessTime = 2.5; // Simulated average
    const successCount = processingHistory.filter(item => item.status === 'Success').length;
    const successRate = totalImages > 0 ? (successCount / totalImages * 100).toFixed(1) : 100;
    
    document.getElementById('totalImages').textContent = totalImages;
    document.getElementById('avgProcessTime').textContent = avgProcessTime + 's';
    document.getElementById('totalSaved').textContent = formatBytes(spaceSaved);
    document.getElementById('successRate').textContent = successRate + '%';
}

// Chart Functions
function initializeCharts() {
    // Processing Statistics Chart
    const processingCtx = document.getElementById('processingChart').getContext('2d');
    processingChart = new Chart(processingCtx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Images Processed',
                data: [12, 19, 15, 25, 22, 30, 28],
                borderColor: '#75F9BD',
                backgroundColor: 'rgba(117, 249, 189, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#EAEAEA'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#EAEAEA'
                    },
                    grid: {
                        color: 'rgba(117, 249, 189, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#EAEAEA'
                    },
                    grid: {
                        color: 'rgba(117, 249, 189, 0.1)'
                    }
                }
            }
        }
    });
    
    // Format Distribution Chart
    const formatCtx = document.getElementById('formatChart').getContext('2d');
    formatChart = new Chart(formatCtx, {
        type: 'doughnut',
        data: {
            labels: ['JPEG', 'PNG', 'WebP', 'Other'],
            datasets: [{
                data: [45, 30, 20, 5],
                backgroundColor: [
                    '#75F9BD',
                    '#5dd9a0',
                    '#45b981',
                    '#2d9962'
                ],
                borderWidth: 2,
                borderColor: '#222021'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#EAEAEA',
                        padding: 15
                    }
                }
            }
        }
    });
}

function updateCharts() {
    // Update with real data from processing history
    const formatCounts = {};
    processingHistory.forEach(item => {
        formatCounts[item.format] = (formatCounts[item.format] || 0) + 1;
    });
    
    if (Object.keys(formatCounts).length > 0) {
        formatChart.data.labels = Object.keys(formatCounts);
        formatChart.data.datasets[0].data = Object.values(formatCounts);
        formatChart.update();
    }
    
    // Update processing chart with recent activity
    const last7Days = getLast7DaysData();
    processingChart.data.datasets[0].data = last7Days;
    processingChart.update();
}

function getLast7DaysData() {
    const data = [0, 0, 0, 0, 0, 0, 0];
    const today = new Date();
    
    processingHistory.forEach(item => {
        const itemDate = new Date(item.timestamp);
        const diffDays = Math.floor((today - itemDate) / (1000 * 60 * 60 * 24));
        if (diffDays < 7) {
            data[6 - diffDays]++;
        }
    });
    
    return data;
}

// DataTable Functions
function initializeDataTable() {
    dataTable = $('#historyTable').DataTable({
        pageLength: 10,
        order: [[0, 'desc']],
        language: {
            emptyTable: 'No processing history available'
        }
    });
}

function addHistoryRow(item) {
    const row = dataTable.row.add([
        formatDate(item.timestamp),
        item.filename,
        formatBytes(item.originalSize),
        formatBytes(item.processedSize),
        item.format.toUpperCase(),
        `<span class="badge bg-success">${item.status}</span>`,
        `<button class="btn btn-sm btn-info" onclick="viewDetails('${item.filename}')">
            <i class="fas fa-eye"></i>
        </button>`
    ]).draw(false);
    
    // Add animation to new row
    $(row.node()).hide().fadeIn(500);
}

function viewDetails(filename) {
    const item = processingHistory.find(h => h.filename === filename);
    if (!item) return;
    
    const savings = ((item.originalSize - item.processedSize) / item.originalSize * 100).toFixed(1);
    
    Swal.fire({
        title: 'Processing Details',
        html: `
            <div style="text-align: left; color: #EAEAEA;">
                <p><strong>Filename:</strong> ${item.filename}</p>
                <p><strong>Processed:</strong> ${formatDate(item.timestamp)}</p>
                <p><strong>Original Size:</strong> ${formatBytes(item.originalSize)}</p>
                <p><strong>Processed Size:</strong> ${formatBytes(item.processedSize)}</p>
                <p><strong>Space Saved:</strong> ${savings}%</p>
                <p><strong>Format:</strong> ${item.format.toUpperCase()}</p>
                <p><strong>Quality:</strong> ${item.options.quality}%</p>
                <p><strong>Resize:</strong> ${item.options.resize}</p>
                <p><strong>Filter:</strong> ${item.options.filter}</p>
            </div>
        `,
        confirmButtonColor: '#75F9BD'
    });
}

function clearHistory() {
    Swal.fire({
        icon: 'warning',
        title: 'Clear History?',
        text: 'This will delete all processing history. This action cannot be undone.',
        showCancelButton: true,
        confirmButtonText: 'Yes, Clear',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d'
    }).then((result) => {
        if (result.isConfirmed) {
            processingHistory = [];
            saveHistoryToStorage();
            dataTable.clear().draw();
            updateStatistics();
            updateCharts();
            
            Swal.fire({
                icon: 'success',
                title: 'History Cleared',
                text: 'All processing history has been deleted',
                timer: 2000,
                showConfirmButton: false
            });
        }
    });
}

// Storage Functions
function saveHistoryToStorage() {
    try {
        localStorage.setItem('btImageProcessorHistory', JSON.stringify(processingHistory));
    } catch (e) {
        console.error('Failed to save history to storage:', e);
    }
}

function loadHistoryFromStorage() {
    try {
        const stored = localStorage.getItem('btImageProcessorHistory');
        if (stored) {
            processingHistory = JSON.parse(stored);
            processingHistory.forEach(item => addHistoryRow(item));
        }
    } catch (e) {
        console.error('Failed to load history from storage:', e);
    }
}

// Utility Functions
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
}

function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Demo Data (for testing)
function loadDemoData() {
    const demoItems = [
        {
            timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
            filename: 'sample-photo-1.jpg',
            originalSize: 2500000,
            processedSize: 1200000,
            format: 'webp',
            status: 'Success',
            options: { resize: 'medium', format: 'webp', quality: 85, filter: 'none' }
        },
        {
            timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
            filename: 'landscape.png',
            originalSize: 5800000,
            processedSize: 2100000,
            format: 'jpeg',
            status: 'Success',
            options: { resize: 'large', format: 'jpeg', quality: 80, filter: 'sharpen' }
        }
    ];
    
    demoItems.forEach(item => {
        processingHistory.push(item);
        addHistoryRow(item);
    });
    
    saveHistoryToStorage();
    updateStatistics();
    updateCharts();
}

// Uncomment to load demo data on first load
// if (processingHistory.length === 0) loadDemoData();
