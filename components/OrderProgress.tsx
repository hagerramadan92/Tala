"use client";

type Props = {
  steps: string[];
  currentStep: number;
};

export default function OrderProgress({ steps, currentStep }: Props) {
  return (
    <div className="flex items-start gap-0">
      {steps.map((label, i) => {
        const done = i <= currentStep;
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`lg:w-8 lg:h-8 w-6 h-6 rounded-full flex items-center border justify-center text-white font-semibold
                ${
                  done
                    ? "bg-[#20a144!important]"
                    : "bg-white border border-gray-800 "
                }
              `}
              >
                {done ? "✓" : " "}
              </div>

              <div
                className={`mr-3 text-[10px] lg:text-[1rem] md:font-semibold text-center md:text-start ${
                  done ? "text-[#20a144!important]" : "text-gray-800"
                } `}
              >
                {label}
              </div>
            </div>

            {i < steps.length - 1 && (
              <div
                aria-hidden
                className={`h-1 flex-1 md:w-12  xl:w-20 mx-0 mb-5 ${
                  i <= currentStep ? "bg-[#20a144]" : "bg-gray-200"
                }`}
              style={{minWidth:20}}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
