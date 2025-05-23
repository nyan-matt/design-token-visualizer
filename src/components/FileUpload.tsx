import { useCallback } from 'react';
import { TokenNode } from '../types/tokens';

interface FileUploadProps {
  onUpload: (tokens: TokenNode) => void;
}

export default function FileUpload({ onUpload }: FileUploadProps) {
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const jsonData = JSON.parse(content) as TokenNode;
        onUpload(jsonData);
      } catch (error) {
        console.error('Error parsing JSON:', error);
        alert('Invalid JSON file. Please upload a valid tokens.json file.');
      }
    };
    reader.readAsText(file);
  }, [onUpload]);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-4">Upload your tokens.json file</h2>
        <label className="block">
          <span className="sr-only">Choose file</span>
          <input
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </label>
      </div>
    </div>
  );
} 