
import { useState, useEffect, useCallback } from 'react';

export type FileType = {
  name: string;
  content: string;
  type: string;
};

export const useProjectFiles = (initialFiles: FileType[]) => {
  const [files, setFiles] = useState<FileType[]>([]);
  const [currentFile, setCurrentFile] = useState<string>("");
  const [mainPreviewFile, setMainPreviewFile] = useState<string>("");
  
  // Get current project ID
  const getCurrentProjectId = useCallback(() => {
    return localStorage.getItem("current_project_id") || "";
  }, []);
  
  // Get storage key for this project
  const getStorageKey = useCallback((key: string) => {
    const projectId = getCurrentProjectId();
    return projectId ? `${projectId}_${key}` : key;
  }, [getCurrentProjectId]);
  
  // Load files from localStorage on initial mount or when project ID changes
  useEffect(() => {
    const projectId = getCurrentProjectId();
    if (!projectId) return;
    
    try {
      // Check for project-specific files in localStorage
      const projectFilesKey = getStorageKey("project_files");
      const savedFiles = localStorage.getItem(projectFilesKey);
      
      if (savedFiles) {
        // Use the saved project files
        setFiles(JSON.parse(savedFiles));
      } else {
        // Check if there are files in the saved_projects array
        const savedProjects = localStorage.getItem("saved_projects");
        if (savedProjects) {
          const projects = JSON.parse(savedProjects);
          const project = projects.find((p: any) => p.id === projectId);
          
          if (project && project.files && project.files.length > 0) {
            // Use the files from the project
            setFiles(project.files);
            // Save these files to project-specific storage
            localStorage.setItem(projectFilesKey, JSON.stringify(project.files));
          } else {
            // Use initial files if no saved files exist for this project
            setFiles(initialFiles);
            // Save initial files to project-specific storage
            localStorage.setItem(projectFilesKey, JSON.stringify(initialFiles));
          }
        } else {
          // Fallback to initial files
          setFiles(initialFiles);
          // Save initial files to project-specific storage
          localStorage.setItem(projectFilesKey, JSON.stringify(initialFiles));
        }
      }
      
      // Load current file for this project
      const lastFile = localStorage.getItem(getStorageKey("current_file"));
      setCurrentFile(lastFile || "index.html");
      
      // Load main preview file for this project
      const mainFile = localStorage.getItem(getStorageKey("main_preview_file"));
      setMainPreviewFile(mainFile || "index.html");
    } catch (error) {
      console.error("Error loading files:", error);
      // Fallback to initial files if error
      setFiles(initialFiles);
      setCurrentFile("index.html");
      setMainPreviewFile("index.html");
    }
  }, [initialFiles, getStorageKey, getCurrentProjectId]);
  
  // Save files to localStorage when they change
  useEffect(() => {
    const projectId = getCurrentProjectId();
    if (files.length > 0 && projectId) {
      try {
        // Save to project-specific storage
        localStorage.setItem(getStorageKey("project_files"), JSON.stringify(files));
        
        // Update the project in saved_projects
        const savedProjects = localStorage.getItem("saved_projects");
        if (savedProjects) {
          const projects = JSON.parse(savedProjects);
          
          const updatedProjects = projects.map((project: any) => {
            if (project.id === projectId) {
              return {
                ...project,
                files: files,
                lastModified: new Date().toISOString()
              };
            }
            return project;
          });
          
          localStorage.setItem("saved_projects", JSON.stringify(updatedProjects));
        }
      } catch (error) {
        console.error("Error saving files:", error);
      }
    }
  }, [files, getStorageKey, getCurrentProjectId]);
  
  // Save current file when it changes
  useEffect(() => {
    const projectId = getCurrentProjectId();
    if (currentFile && projectId) {
      localStorage.setItem(getStorageKey("current_file"), currentFile);
    }
  }, [currentFile, getStorageKey, getCurrentProjectId]);
  
  // Save main preview file when it changes
  useEffect(() => {
    const projectId = getCurrentProjectId();
    if (mainPreviewFile && projectId) {
      localStorage.setItem(getStorageKey("main_preview_file"), mainPreviewFile);
    }
  }, [mainPreviewFile, getStorageKey, getCurrentProjectId]);
  
  const updateFileContent = useCallback((fileName: string, content: string) => {
    setFiles(prevFiles => 
      prevFiles.map(file => 
        file.name === fileName ? { ...file, content } : file
      )
    );
  }, []);
  
  // Handles file upload by converting ArrayBuffer to string
  const handleFileUpload = useCallback((uploadedFile: { name: string, content: string | ArrayBuffer, type: string }) => {
    // Convert ArrayBuffer to string if needed
    const fileContent = typeof uploadedFile.content === 'string' 
      ? uploadedFile.content 
      : new TextDecoder().decode(uploadedFile.content);
    
    const newFile: FileType = {
      name: uploadedFile.name,
      content: fileContent,
      type: uploadedFile.type
    };
    
    // Check if file already exists
    setFiles(prevFiles => {
      const existingFileIndex = prevFiles.findIndex(f => f.name === uploadedFile.name);
      if (existingFileIndex >= 0) {
        // Update existing file
        const updatedFiles = [...prevFiles];
        updatedFiles[existingFileIndex] = newFile;
        return updatedFiles;
      } else {
        // Add new file
        return [...prevFiles, newFile];
      }
    });
    
    // Set as current file
    setCurrentFile(uploadedFile.name);
  }, []);
  
  return {
    files,
    setFiles,
    currentFile,
    setCurrentFile,
    mainPreviewFile,
    setMainPreviewFile,
    updateFileContent,
    getCurrentProjectId,
    getStorageKey,
    handleFileUpload
  };
};
