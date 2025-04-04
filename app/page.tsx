import { PayBlock } from "@/components/Pay";
import { SignIn } from "@/components/SignIn";
import { VerifyBlock } from "@/components/Verify";
import { BackgroundNoiseBlock } from "@/components/BackgroundNoise";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 gap-y-3">
      <h1 className="text-3xl font-bold mb-6">MapMint</h1>
      {/* <SignIn /> */}
      <VerifyBlock />
      <BackgroundNoiseBlock />
      {/* <PayBlock /> */}
    </main>
  );
}
