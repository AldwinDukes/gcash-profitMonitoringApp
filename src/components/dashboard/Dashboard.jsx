import { IoWalletOutline } from "react-icons/io5";
import { IoMdTrendingUp } from "react-icons/io";
import { GrNotes } from "react-icons/gr";
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
    receiptImg: null,
  });
  const totalProfit = addTrans.reduce(
    (total, trans) => total + Number(trans.chargeAmount),
    0,
  );

  const clearInputForm = () => {
    setTransactionData({
      transType: "",
      amount: 0,
      transDateTime: "",
      chargeAmount: 0,
      accountName: "",
      receiptImg: null,
    });
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
    if (!lines || lines.length < 10) {
      toast.error("Receipt format not recognized. Please try a clearer photo.");
      setLoading(false);
      return;
    }

    const type = lines.some((line) => line.includes(STORE_GCASH_NUMBER))
      ? "Cash Out"
      : "Cash In";
    const dateAndTime = lines[9] || "Date not found";
    const name = lines[0] || "Name not found";

    const strAmount = lines[7] || "";
    const strAmountToNum = Number(strAmount.replace(/,/g, ""));

    if (isNaN(strAmountToNum) || strAmountToNum === 0) {
      toast.error("Could not read amount. Please enter manually.");
      // We don't return here so the user can still see the image and type it in
    }

    const charge = calculateCharge(strAmountToNum);

    setTransactionData((prev) => ({
      ...prev, // Keep the receiptImg that was set in handleFileChange!
      transType: type,
      transDateTime: dateAndTime,
      accountName: name,
      amount: strAmountToNum,
      chargeAmount: charge,
    }));
  };

  // const getTransactionType = (lines) => {
  //   const storeGcashNumber = "+63 975 596 1986";
  //   const type = lines.includes(storeGcashNumber) ? "Cash Out" : "Cash In";

  //   setTransactionData((prev) => ({
  //     ...prev,
  //     transType: type,
  //   }));
  // };

  // const getDateTime = (lines) => {
  //   const dateAndTime = lines[9];

  //   setTransactionData((prev) => ({
  //     ...prev,
  //     transDateTime: dateAndTime,
  //   }));
  // };

  // const getName = (lines) => {
  //   const name = lines[0];
  //   setTransactionData((prev) => ({ ...prev, accountName: name }));
  // };

  // const getAmount = (lines) => {
  //   const strAmount = lines[7];
  //   const strAmountToNum = Number(strAmount.replace(/,/g, ""));

  //   if (isNaN(strAmountToNum)) {
  //     toast.error("Please upload a valid receipt!");
  //     clearInputForm();
  //     return;
  //   }

  //   setTransactionData((prev) => ({
  //     ...prev,
  //     amount: strAmountToNum,
  //     chargeAmount: charge,
  //   }));

  //   const charge = calculateCharge(setTransactionData.amount);
  // }; // str to num => remove (,) comma

  const handleOCR = async (image) => {
    try {
      setLoading(true);

      const rawText = await fetchDataFromOCR(image);

      rawTextToJsonFile(rawText);
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
      // use the converImg function to convert the inserted file to base64
      const processedImage = await base64Converter(file);

      setTransactionData((prev) => ({
        ...prev,
        receiptImg: processedImage,
      }));

      handleOCR(processedImage);
    } catch (error) {
      console.log("Image conversion failed:", error);
    }
  };

  const handleAddTransHistory = () => {
    if (!transactionData.receiptImg) {
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
              {!transactionData.receiptImg && (
                <UploadImageForm fileHandle={handleFileChage} />
              )}

              {transactionData.receiptImg && (
                <PreviewReceipt image={transactionData.receiptImg} />
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
          <div className="flex gap-2 items-center p-4">
            <GrNotes size={20} />
            <h3 className="font-semibold">Transaction History</h3>
          </div>

          {addTrans.length > 0 ? (
            <section>
              {addTrans.map((trans, index) => (
                <CreateTransactionHistory key={index} {...trans} />
              ))}
            </section>
          ) : (
            <section className="flex flex-col items-center p-8">
              <GrNotes
                size={40}
                color="oklch(70.7% 0.022 261.325)"
                className="mb-2"
              />
              <p className="font-extralight text-center text-sm">
                No transaction yet. Add your first transaction above.
              </p>
            </section>
          )}
        </section>
      </main>
    </>
  );
}

// rawTextToJsonFile → services/receiptParser.js
