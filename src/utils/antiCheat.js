// frontend/src/utils/antiCheat.js
// Detects VMs, RDP, virtual cameras, automation tools.

export const detectEnvironment = async () => {
    const result = {
        isVM: false,
        isRDP: false,
        isVirtualCamera: false,
        isAutomated: false,
        isScreenShare: false,
        flags: [],
        webdriver: false,
        details: {},
    };

    // 1. WebDriver detection (Selenium/Puppeteer)
    if (navigator.webdriver === true) {
        result.isAutomated = true;
        result.webdriver = true;
        result.flags.push('webdriver_detected');
    }

    // 2. Headless detection
    if (navigator.plugins.length === 0 && navigator.languages.length === 0) {
        result.isAutomated = true;
        result.flags.push('headless_browser');
    }

    // 3. Chrome automation flags
    if (window.chrome && window.chrome.runtime === undefined) {
        // Present in some automation environments
        result.details.chrome_runtime_missing = true;
    }

    // 4. VM detection via hardware info
    const cores = navigator.hardwareConcurrency;
    const memory = navigator.deviceMemory;

    if (cores && cores < 2) {
        result.flags.push('low_cpu_cores');
        result.details.cpu_cores = cores;
    }
    if (memory && memory < 2) {
        result.flags.push('low_memory');
        result.details.memory_gb = memory;
    }

    // 5. Screen analysis for RDP
    const screen = window.screen;
    result.details.screen = {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth,
        availWidth: screen.availWidth,
        availHeight: screen.availHeight,
    };

    // RDP often has color depth 16 or lower
    if (screen.colorDepth < 24) {
        result.isRDP = true;
        result.flags.push('low_color_depth');
    }

    // Unusual screen sizes (VM defaults)
    const commonVMSizes = [
        [1024, 768], [800, 600], [1280, 720], [1366, 768]
    ];
    if (commonVMSizes.some(([w, h]) => screen.width === w && screen.height === h)) {
        result.flags.push('common_vm_resolution');
    }

    // 6. WebGL info (VM GPUs show distinctive strings)
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
                const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';
                result.details.gpu = { renderer, vendor };

                const vmGPUs = [
                    'vmware', 'virtualbox', 'virgl', 'llvmpipe',
                    'swiftshader', 'microsoft basic render',
                    'parallels', 'qemu', 'bochs', 'xen',
                ];
                const lower = (renderer + ' ' + vendor).toLowerCase();
                if (vmGPUs.some(v => lower.includes(v))) {
                    result.isVM = true;
                    result.flags.push('vm_gpu_detected');
                }
            }
        }
    } catch (e) {
        result.details.webgl_error = true;
    }

    // 7. Camera device check (virtual cameras have distinctive names)
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(d => d.kind === 'videoinput');

        const virtualCameraNames = [
            'virtual', 'obs', 'droidcam', 'epoccam', 'manycam',
            'snap camera', 'xsplit', 'youcam', 'splitcam',
            'iriun', 'camtwist',
        ];

        cameras.forEach(cam => {
            const name = (cam.label || '').toLowerCase();
            if (virtualCameraNames.some(v => name.includes(v))) {
                result.isVirtualCamera = true;
                result.flags.push(`virtual_camera: ${cam.label}`);
            }
        });

        result.details.cameras = cameras.map(c => c.label);
    } catch (e) {
        // Permission likely denied
    }

    // 8. Screen sharing detection (approximate)
    try {
        const permissions = await navigator.permissions.query({ name: 'display-capture' });
        if (permissions.state === 'granted') {
            result.isScreenShare = true;
            result.flags.push('display_capture_granted');
        }
    } catch (e) {
        // Not supported
    }

    // 9. Multiple monitor detection
    if (window.screen && window.screen.isExtended) {
        result.flags.push('multiple_monitors');
        result.details.multiple_monitors = true;
    }

    // 10. Detect common dev tool extensions
    const suspiciousGlobalKeys = [
        '__REACT_DEVTOOLS_GLOBAL_HOOK__', // Actually expected in React - skip
    ];

    // 11. Detect remote desktop indicators
    // RDP sessions often have connection info in navigator
    if (navigator.connection && navigator.connection.rtt) {
        // Very high RTT can indicate RDP
        if (navigator.connection.rtt > 200) {
            result.flags.push('high_connection_rtt');
        }
    }

    // 12. Check if getDisplayMedia is being used (screen sharing)
    // We can't directly detect, but we can log if user has unusual focus patterns

    return result;
};

/**
 * Combined severity check - returns highest severity level.
 */
export const assessRisk = (envResult) => {
    let severity = 'LOW';
    const criticalFlags = ['webdriver_detected', 'headless_browser', 'vm_gpu_detected'];
    const highFlags = ['virtual_camera', 'low_color_depth', 'display_capture_granted'];

    if (envResult.flags.some(f => criticalFlags.some(c => f.includes(c)))) {
        severity = 'CRITICAL';
    } else if (envResult.flags.some(f => highFlags.some(h => f.includes(h)))) {
        severity = 'HIGH';
    } else if (envResult.flags.length > 2) {
        severity = 'MEDIUM';
    }

    return severity;
};