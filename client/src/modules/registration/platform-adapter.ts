import { createContext, useContext } from "react";

export interface ImageUploadResult {
  uri: string;
  base64?: string;
  mimeType?: string;
  size?: number;
  fileName?: string;
}

export interface IPlatformAdapter {
  storage: {
    getItem: (key: string) => Promise<string | null>;
    setItem: (key: string, value: string) => Promise<void>;
    removeItem: (key: string) => Promise<void>;
  };
  navigation: {
    openUrl: (url: string) => Promise<boolean>;
  };
  fileUpload: {
    selectImage: () => Promise<ImageUploadResult | null>;
  };
  ui: {
    showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  };
}

export class WebPlatformAdapter implements IPlatformAdapter {
  private objectUrls: Set<string> = new Set();

  storage = {
    getItem: async (key: string) => {
      if (typeof window === 'undefined' || !window.localStorage) {
        return null;
      }
      return localStorage.getItem(key);
    },
    setItem: async (key: string, value: string) => {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, value);
      }
    },
    removeItem: async (key: string) => {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(key);
      }
    }
  };

  navigation = {
    openUrl: async (url: string): Promise<boolean> => {
      if (typeof window === 'undefined') {
        return false;
      }
      const opened = window.open(url, "_blank");
      return opened !== null;
    }
  };

  fileUpload = {
    selectImage: async (): Promise<ImageUploadResult | null> => {
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        return null;
      }

      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = (e: Event) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file && file.type.startsWith('image/')) {
            const objectUrl = URL.createObjectURL(file);
            this.objectUrls.add(objectUrl);

            const reader = new FileReader();
            reader.onloadend = () => {
              resolve({
                uri: objectUrl,
                base64: reader.result as string,
                mimeType: file.type,
                size: file.size,
                fileName: file.name
              });
            };
            reader.readAsDataURL(file);
          } else {
            resolve(null);
          }
        };
        
        input.oncancel = () => resolve(null);
        input.click();
      });
    }
  };

  ui = {
    showToast: undefined
  };

  cleanup() {
    this.objectUrls.forEach(url => URL.revokeObjectURL(url));
    this.objectUrls.clear();
  }
}

export const defaultPlatformAdapter = new WebPlatformAdapter();

export const RegistrationPlatformContext = createContext<IPlatformAdapter>(defaultPlatformAdapter);

export const usePlatform = () => useContext(RegistrationPlatformContext);

export const RegistrationPlatformProvider = RegistrationPlatformContext.Provider;
