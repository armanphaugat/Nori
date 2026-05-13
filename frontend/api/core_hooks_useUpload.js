// core/hooks/useUpload.js
// Document upload state management hook

import { useState, useCallback } from 'react';
import { apiClient } from '../api/client';

/**
 * Handle document uploads (PDFs + URLs)
 * @returns {{files, urls, progress, loading, error, addFiles, addUrl, removeFile, removeUrl, upload, clear}}
 */
export function useUpload() {
  const [files, setFiles] = useState([]);
  const [urls, setUrls] = useState([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Add files to the upload queue
   * @param {File[]} newFiles - Files to add
   */
  const addFiles = useCallback((newFiles) => {
    const validFiles = Array.from(newFiles).filter((file) => {
      // Only accept PDFs
      if (!file.type.includes('pdf')) {
        console.warn(`Skipping non-PDF file: ${file.name}`);
        return false;
      }
      return true;
    });

    setFiles((prev) => [
      ...prev,
      ...validFiles.map((file) => ({
        id: `${file.name}-${Date.now()}`,
        file,
        name: file.name,
        size: file.size,
      })),
    ]);
  }, []);

  /**
   * Add a URL to the upload queue
   * @param {string} url - URL to add
   */
  const addUrl = useCallback((url) => {
    if (url && url.trim()) {
      const trimmedUrl = url.trim();
      // Check if URL already exists
      if (!urls.some((u) => u.url === trimmedUrl)) {
        setUrls((prev) => [
          ...prev,
          {
            id: `${trimmedUrl}-${Date.now()}`,
            url: trimmedUrl,
          },
        ]);
      }
    }
  }, [urls]);

  /**
   * Remove a file from the queue
   * @param {string} id - File ID
   */
  const removeFile = useCallback((id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  /**
   * Remove a URL from the queue
   * @param {string} id - URL ID
   */
  const removeUrl = useCallback((id) => {
    setUrls((prev) => prev.filter((u) => u.id !== id));
  }, []);

  /**
   * Upload all files and URLs to the knowledge base
   * @param {string} guildId - Guild/server ID
   * @returns {Promise<{status, message, urls_processed, pdfs_processed}>}
   */
  const upload = useCallback(
    async (guildId) => {
      if (files.length === 0 && urls.length === 0) {
        setError('Please add files or URLs before uploading');
        return;
      }

      setLoading(true);
      setError(null);
      setProgress(0);

      try {
        // Simulate progress
        const progressInterval = setInterval(() => {
          setProgress((prev) => Math.min(prev + 10, 90));
        }, 300);

        const fileObjects = files.map((f) => f.file);
        const urlStrings = urls.map((u) => u.url);

        const response = await apiClient.upload.documents(
          fileObjects,
          urlStrings,
          guildId
        );

        clearInterval(progressInterval);
        setProgress(100);

        // Clear on success
        setFiles([]);
        setUrls([]);

        return response;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
        // Reset progress after a delay
        setTimeout(() => setProgress(0), 1000);
      }
    },
    [files, urls]
  );

  /**
   * Clear all files and URLs
   */
  const clear = useCallback(() => {
    setFiles([]);
    setUrls([]);
    setError(null);
    setProgress(0);
  }, []);

  return {
    files,
    urls,
    progress,
    loading,
    error,
    addFiles,
    addUrl,
    removeFile,
    removeUrl,
    upload,
    clear,
  };
}