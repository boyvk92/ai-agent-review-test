interface ButtonElementtProps {
  event: () => void;
  label?: string;
  sizeWidth?: number;
  backgroundColor?: string;
}

export function ButtonElementt(props: ButtonElementtProps) {
  const { event, sizeWidth, backgroundColor } = props;
  return (
    <button
      className={`rounded-2xl py-4 text-lg font-semibold text-white hover:bg-blue-700 ${sizeWidth === 2 ? "col-span-2" : ""} ${backgroundColor || "bg-blue-600"}`}
      onClick={() => event()}
    >
      {props.label}
    </button>
  );
}
