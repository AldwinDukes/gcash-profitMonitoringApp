import { MdOutlineFileUpload } from "react-icons/md";

export default function UploadImageForm({ fileHandle }) {
  return (
    <>
      <div className="border border-dashed rounded-md mb-4 p-4">
        <label
          htmlFor="receiptImage"
          className="flex flex-col items-center font-extralight"
        >
          <MdOutlineFileUpload size={35} />
          Click to upload receipt image
        </label>
        <input
          type="file"
          id="receiptImage"
          className="hidden"
          onChange={fileHandle}
        />
      </div>
    </>
  );
}
