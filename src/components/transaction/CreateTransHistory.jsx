export default function CreateTransactionHistory({ ...transactionDetails }) {
  const { transType, amount, transDateTime, accountName } = transactionDetails;
  return (
    <div className="flex justify-between p-4">
      <div>
        <p className="font-extralight text-sm">{transType}</p>
        <p className="font-bold">{accountName}</p>
      </div>
      <div>
        <p className="font-extralight text-sm">{transDateTime}</p>
        <p className="font-bold text-center">
          <span>{transType === "Cash Out" ? "+ " : "- "}</span>
          &#8369;
          {amount}
        </p>
      </div>
    </div>
  );
}
