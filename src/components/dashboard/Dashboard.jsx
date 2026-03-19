import { IoWalletOutline } from "react-icons/io5";
import { IoMdTrendingUp } from "react-icons/io";
import { GrNotes } from "react-icons/gr";
import { IoIosMenu } from "react-icons/io";

import { useState } from "react";

import { ToastContainer, toast, Zoom } from "react-toastify";
import { FadeLoader } from "react-spinners";

import UploadImageForm from "../receipt/UploadImageForm";
import PreviewReceipt from "../receipt/PreviewReceipt";

import CreateTransactionHistory from "../transaction/CreateTransHistory";

import { useLocalStorage } from "../../hooks/useLocalStorage";

import { STORE_GCASH_NUMBER } from "../../constants/gcashConfig";

import { fetchDataFromOCR } from "../../services/ocrService";
import { base64Converter } from "../../utils/base64ConverterUtils";
import { calculateCharge } from "../../utils/currencyUtils";
import { textParser } from "../../services/receiptParser";

export default function Dashboard() {
  const [addTrans, setAddTrans] = useLocalStorage("transactions", []);
  const [loading, setLoading] = useState(false);
  const [transactionData, setTransactionData] = useState({
    transType: "",
    amount: 0,
    transDateTime: "",
    chargeAmount: 0,
    accountName: "",
  });
  const totalProfit = addTrans.reduce(
    (total, trans) => total + Number(trans.chargeAmount),
    0,
  );
  const [tempImg, setTempImg] = useState(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // If isExpanded is true, show everything.
  // If false, only show the first 3.
  const visibleTransactions = isExpanded ? addTrans : addTrans.slice(0, 3);

  const clearInputForm = () => {
    setTransactionData({
      transType: "",
      amount: 0,
      transDateTime: "",
      chargeAmount: 0,
      accountName: "",
    });
    setTempImg(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setTransactionData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }; //This uses computed property names. If propName = "amount" → it updates transaction.amount

  const rawTextToJsonFile = (rawText) => {
    const parsedDetails = textParser(rawText);
    processReceiptData(parsedDetails);
  };

  const processReceiptData = (lines) => {
    // Check if it's a GCash receipt (looking for specific keywords)
    const isGcash = lines.some((line) => line.toLowerCase().includes("gcash"));

    if (!isGcash) {
      toast.error("Invalid receipt! Please upload a GCash screenshot.");
      setTempImg(null); // Remove the preview immediately
      return;
    }

    if (!lines || lines.length < 10) {
      toast.error("Receipt format not recognized. Please try a clearer photo.");
      setLoading(false);
      return;
    }

    const type = lines.some((line) => line.includes(STORE_GCASH_NUMBER))
      ? "Cash Out"
      : "Cash In";

    const dateAndTime = lines[8] || "Date not found";
    const name = lines[0] || "Name not found";

    const strAmount = lines[4] || "";
    const strAmountToNum = Number(strAmount.replace(/,/g, ""));

    if (isNaN(strAmountToNum) || strAmountToNum === 0) {
      toast.error("Could not read amount. Please enter manually.");
      // We don't return here so the user can still see the image and type it in
    }

    const charge = calculateCharge(strAmountToNum);

    setTransactionData((prev) => ({
      ...prev,
      transType: type,
      transDateTime: dateAndTime,
      accountName: name,
      amount: strAmountToNum,
      chargeAmount: charge,
    }));
  };

  const handleOCR = async (image) => {
    try {
      setLoading(true);

      const rawText = await fetchDataFromOCR(image); // converting the image to text

      rawTextToJsonFile(rawText); // converting the text to JSON file
    } catch (error) {
      console.log(error.message);
      toast.error("Please insert a valid receipt!");
      clearInputForm();
    } finally {
      setLoading(false);
    }
  };

  const handleFileChage = async (e) => {
    // Get the first selected file from fileList
    const file = e.target.files[0];

    // If there is no file, stop the function.
    if (!file) return;

    try {
      const processedImage = await base64Converter(file); // converting the image to base64 format

      setTempImg(processedImage);

      handleOCR(processedImage); // Send to OCR for validation
    } catch (error) {
      console.log("Image conversion failed:", error);
    }
  };

  const handleAddTransHistory = () => {
    if (!tempImg) {
      toast.error("Please upload receipt!");
      return;
    }

    setAddTrans((prev) => [...prev, { ...transactionData }]);

    clearInputForm();

    toast.success("Transaction added");
  };

  return (
    <>
      {loading && (
        <div className="z-10 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <FadeLoader color="#1693e3" loading={loading} />
        </div>
      )}

      <ToastContainer
        position="top-center"
        autoClose={3000}
        transition={Zoom}
      />
      <header className="bg-blue-600 p-2 mb-4 flex items-center gap-2">
        <div className="bg-white rounded-xl p-1 flex justify-center items-center">
          <IoWalletOutline size={30} color="oklch(62.3% 0.214 259.815)" />
        </div>
        <h1 className="text-white font-bold text-xl">GCash Monitor</h1>
      </header>

      <main className="px-4 mb-10">
        <section className="border border-neutral-200 shadow-md rounded-md p-4 mb-8">
          <div className="flex justify-between items-center px-2">
            <h2>Total Profit</h2>

            <div className="bg-fuchsia-200 p-2 rounded-md">
              <IoMdTrendingUp size={15} color="oklch(51.8% 0.253 323.949)" />
            </div>
          </div>
          <p className="pl-2 font-bold">
            &#8369; <span>{`${totalProfit}.00`}</span>
          </p>
        </section>

        <section className="relative border border-neutral-200 shadow-md rounded-md mb-8">
          <div className="p-4">
            <h3 className="font-semibold mb-4">+ Add New Transaction</h3>

            <div className="flex flex-col mb-4">
              <label htmlFor="transType" className="mb-2">
                Transaction Type
              </label>

              <select
                className="bg-gray-200 rounded-md p-2"
                name="transType"
                id="transType"
                value={transactionData.transType}
                onChange={handleChange}
              >
                <option value="Cash Out">Cash Out</option>
                <option value="Cash In">Cash In</option>
              </select>
            </div>

            <div className="flex flex-col mb-4">
              <label htmlFor="inputDate" className="mb-2">
                Date and Time
              </label>
              <input
                className="bg-gray-200 rounded-md p-2"
                type="text"
                name="inputDate"
                id="inputDate"
                value={transactionData.transDateTime}
                onChange={handleChange}
              />
            </div>

            <div className="flex flex-col mb-4">
              <label htmlFor="amount">Amount (&#8369;)</label>
              <input
                className="bg-gray-200 rounded-md p-2"
                type="text"
                placeholder="0.00"
                id="amount"
                name="amount"
                inputMode="numeric"
                value={transactionData.amount}
                onChange={handleChange}
              />
            </div>

            <div className="flex flex-col mb-4">
              <label className="mb-2" htmlFor="inputProfit">
                Charge (Optional,&#8369;)
              </label>
              <input
                className="bg-gray-200 rounded-md p-2"
                type="number"
                name="inputProfit"
                id="inputProfit"
                value={transactionData.chargeAmount}
                onChange={handleChange}
              />
            </div>

            <div>
              {tempImg === null ? (
                <UploadImageForm fileHandle={handleFileChage} />
              ) : (
                <PreviewReceipt image={tempImg} />
              )}
            </div>

            <div className="flex justify-center">
              <button
                className="bg-blue-600 text-white font-semibold p-2.5 rounded-md w-full"
                onClick={handleAddTransHistory}
              >
                Add Transaction
              </button>
            </div>
          </div>
        </section>

        <section className="border border-neutral-200 shadow-md rounded-md">
          <div className="flex justify-between items-center p-4">
            <div className="flex gap-2 items-center">
              <h3 className="font-semibold">Transaction History</h3>
            </div>
            <button className="font-semibold text-sm text-red-600">
              Clear all
            </button>
          </div>

          {addTrans.length > 0 ? (
            <section>
              {/* Map through the SLICED array here */}
              {visibleTransactions.map((trans, index) => (
                <CreateTransactionHistory key={index} {...trans} />
              ))}

              {/* Only show the "See All" button if there are more than 3 items */}
              {addTrans.length > 3 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="w-full py-3 text-sm font-medium text-blue-600 hover:bg-gray-50 border-t border-gray-100 transition-colors"
                >
                  {isExpanded
                    ? "Show Less"
                    : `See All (${addTrans.length - 3} more)`}
                </button>
              )}
            </section>
          ) : (
            <section className="flex flex-col items-center p-8">
              <p className="text-sm text-gray-400">No transactions yet.</p>
            </section>
          )}
        </section>
      </main>
    </>
  );
}

// Reset all to zero // add a confirmation pop up // Top right of the History section // Make the text "Clear All" small and perhaps a lighter gray until hovered.
// responsiveness fix the desktop screen reduce it to 70-80 percent only
