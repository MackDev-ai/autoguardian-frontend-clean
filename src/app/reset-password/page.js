import { Suspense } from "react";
import ResetPasswordForm from "./ResetPasswordForm";

export default function Page() {
  return (
    <Suspense fallback={<p className="p-6">Ładowanie formularza...</p>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
