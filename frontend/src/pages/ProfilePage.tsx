import {
  BadgeCheck,
  Mail,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { getInitials } from "../utils/formatters";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="app-page mx-auto max-w-[840px]">
      <section className="px-[3px] py-1">
        <div>
          <h1 className="page-heading">
            Profile
          </h1>
        </div>
      </section>

      <section className="surface relative flex min-h-[180px] items-center justify-between gap-[22px] overflow-hidden rounded-[19px] px-[27px] py-[25px] max-[760px]:items-start max-[760px]:flex-col max-[760px]:p-[21px]">
        <div className="absolute right-[-92px] top-[-140px] h-[280px] w-[280px] rounded-full bg-[rgba(107,183,249,0.14)]" />

        <div className="relative z-[1] flex min-w-0 items-center gap-[18px] max-[520px]:items-start max-[520px]:flex-col">
          <div className="grid h-[82px] w-[82px] flex-none place-items-center rounded-full border-4 border-[rgba(255,255,255,0.58)] bg-[linear-gradient(145deg,#78c1ff,#3979d2)] text-[19px] font-bold text-white shadow-[0_13px_28px_rgba(43,112,204,0.2),inset_0_1px_rgba(255,255,255,0.27)] max-[760px]:h-[70px] max-[760px]:w-[70px] max-[520px]:h-16 max-[520px]:w-16">
            {getInitials(user?.name)}
          </div>

          <div className="grid min-w-0 gap-[5px]">
            <div className="flex flex-wrap items-center gap-2 max-[520px]:items-start max-[520px]:flex-col">
              <h2 className="m-0 overflow-hidden text-ellipsis whitespace-nowrap text-[22px] font-bold leading-[1.2] tracking-[-0.035em] text-[#163855] max-[760px]:text-[19px]">
                {user?.name ??
                  "Unknown user"}
              </h2>

              <span className="inline-flex w-fit items-center gap-1 rounded-full border border-[#d8e9f8] bg-[#eef7ff] px-[7px] py-1 text-[8px] font-bold uppercase tracking-[0.06em] text-[#2677c9]">
                <BadgeCheck
                  aria-hidden="true"
                  size={13}
                  strokeWidth={1.9}
                />

                {user?.role ??
                  "User"}
              </span>
            </div>

            <p className="m-0 inline-flex items-center gap-[6px] text-[10px] text-[#70879a]">
              <Mail
                aria-hidden="true"
                size={14}
                strokeWidth={1.8}
              />

              {user?.email ??
                "No email available"}
            </p>

            <span className="mt-1 max-w-[500px] text-[9px] leading-[1.55] text-[#95a5b1]">
              Your WinCapture account is
              connected to Microsoft Entra ID.
            </span>
          </div>
        </div>

      </section>
    </div>
  );
}


