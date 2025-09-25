import { useState, useRef, useEffect } from "react";

function NodeOutputImage({ src }: { src: string }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  const openImageInNewTab = () => {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head><title>K-means Cluster Image</title></head>
          <body style="margin:0; display:flex; justify-content:center; align-items:center; height:100vh; background:#fff;">
            <img src="${src}" style="max-width:100vw; max-height:100vh; display:block;" />
          </body>
        </html>
      `);
      newWindow.document.close();
    } else {
      alert("Popup blocked! Please allow popups for this site.");
    }
  };

  return (
    <div className="relative border-t border-gray-200 dark:border-gray-600 p-2 flex justify-center">
      <img
        src={src}
        alt="K-means Cluster Result"
        className="max-w-full max-h-48 rounded cursor-pointer"
        onClick={() => setShowMenu(!showMenu)}
      />
      {showMenu && (
        <div
          ref={menuRef}
          className="absolute top-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded shadow-md p-2 z-10"
          style={{ minWidth: 160 }}
        >
          <button
            className="text-blue-600 hover:underline w-full text-left"
            onClick={openImageInNewTab}
          >
            Open image in new tab
          </button>
        </div>
      )}
    </div>
  );
}

export default NodeOutputImage;