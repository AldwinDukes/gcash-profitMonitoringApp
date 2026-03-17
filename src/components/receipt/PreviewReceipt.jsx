export default function PreviewReceipt({ image }) {
  return (
    <>
      <div className="flex justify-center items-center mb-4">
        <img src={image} alt="preview" className="w-40 mt-4" />
      </div>
    </>
  );
}
