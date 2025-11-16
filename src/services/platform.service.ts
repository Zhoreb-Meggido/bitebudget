/**
 * Platform Detection Service
 * Detects the operating system and browser capabilities
 */

export type Platform = 'windows' | 'macos' | 'linux' | 'android' | 'ios' | 'unknown';

class PlatformService {
  private platform: Platform | null = null;

  /**
   * Detect the current platform
   */
  getPlatform(): Platform {
    if (this.platform) {
      return this.platform;
    }

    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform?.toLowerCase() || '';

    if (userAgent.includes('android')) {
      this.platform = 'android';
    } else if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ipod')) {
      this.platform = 'ios';
    } else if (userAgent.includes('win') || platform.includes('win')) {
      this.platform = 'windows';
    } else if (userAgent.includes('mac') || platform.includes('mac')) {
      this.platform = 'macos';
    } else if (userAgent.includes('linux') || platform.includes('linux')) {
      this.platform = 'linux';
    } else {
      this.platform = 'unknown';
    }

    return this.platform;
  }

  /**
   * Check if running on Windows
   */
  isWindows(): boolean {
    return this.getPlatform() === 'windows';
  }

  /**
   * Check if running on macOS
   */
  isMac(): boolean {
    return this.getPlatform() === 'macos';
  }

  /**
   * Check if running on Linux
   */
  isLinux(): boolean {
    return this.getPlatform() === 'linux';
  }

  /**
   * Check if running on Android
   */
  isAndroid(): boolean {
    return this.getPlatform() === 'android';
  }

  /**
   * Check if running on iOS
   */
  isIOS(): boolean {
    return this.getPlatform() === 'ios';
  }

  /**
   * Check if running on a desktop platform
   */
  isDesktop(): boolean {
    const platform = this.getPlatform();
    return platform === 'windows' || platform === 'macos' || platform === 'linux';
  }

  /**
   * Check if running on a mobile platform
   */
  isMobile(): boolean {
    const platform = this.getPlatform();
    return platform === 'android' || platform === 'ios';
  }

  /**
   * Check if File System Access API is supported
   */
  supportsFileSystemAccess(): boolean {
    return 'showOpenFilePicker' in window;
  }

  /**
   * Check if running on a platform that can access mapped Google Drive
   * (Windows/Mac/Linux with File System Access API)
   */
  canAccessMappedDrive(): boolean {
    return this.isDesktop() && this.supportsFileSystemAccess();
  }
}

export const platformService = new PlatformService();
