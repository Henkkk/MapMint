"use client";
import {
  MiniKit,
  VerificationLevel,
  ISuccessResult,
  MiniAppVerifyActionErrorPayload,
  IVerifyResponse,
} from "@worldcoin/minikit-js";
import { useCallback, useState, useEffect } from "react";

export type VerifyCommandInput = {
  action: string;
  signal?: string;
  verification_level?: VerificationLevel; // Default: Orb
};

const verifyPayload: VerifyCommandInput = {
  action: "mapmint", // This is your action ID from the Developer Portal
  signal: "",
  verification_level: VerificationLevel.Orb, // Orb | Device
};

export const VerifyBlock = () => {
  const [handleVerifyResponse, setHandleVerifyResponse] = useState<
    MiniAppVerifyActionErrorPayload | IVerifyResponse | null
  >(null);
  const [isVerified, setIsVerified] = useState(false);

  // Check if already verified on load
  useEffect(() => {
    const checkCookie = () => {
      const cookies = document.cookie.split(';');
      const verifiedCookie = cookies.find(cookie => cookie.trim().startsWith('world-id-verified='));
      const verified = verifiedCookie?.includes('true') || false;
      setIsVerified(verified);
      
      // If already verified, dispatch event for other components to know
      if (verified) {
        window.dispatchEvent(new CustomEvent('world-id-verified', { detail: true }));
      }
    };
    
    checkCookie();
  }, []);

  const handleVerify = useCallback(async () => {
    if (!MiniKit.isInstalled()) {
      console.warn("Tried to invoke 'verify', but MiniKit is not installed.");
      return null;
    }

    const { finalPayload } = await MiniKit.commandsAsync.verify(verifyPayload);

    // no need to verify if command errored
    if (finalPayload.status === "error") {
      console.log("Command error");
      console.log(finalPayload);

      setHandleVerifyResponse(finalPayload);
      return finalPayload;
    }

    // Verify the proof in the backend
    const verifyResponse = await fetch(`/api/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payload: finalPayload as ISuccessResult, // Parses only the fields we need to verify
        action: verifyPayload.action,
        signal: verifyPayload.signal, // Optional
      }),
    });

    const verifyResponseJson = await verifyResponse.json();

    if (verifyResponseJson.status === 200) {
      console.log("Verification success!");
      console.log(finalPayload);
      
      // Set verified status and store in cookie
      setIsVerified(true);
      
      // Set a cookie to persist the verification
      document.cookie = "world-id-verified=true; path=/; max-age=3600"; // Expires in 1 hour
      
      // Trigger a storage event to notify other components
      localStorage.setItem('world-id-verified', 'true');
      
      // Clear response message on successful verification
      setHandleVerifyResponse(null);
      
      // Dispatch a custom event that verification succeeded
      window.dispatchEvent(new CustomEvent('world-id-verified', { detail: true }));
      
      return verifyResponseJson;
    }

    setHandleVerifyResponse(verifyResponseJson);
    return verifyResponseJson;
  }, []);

  return (
    <div className="w-full max-w-md p-4 bg-white rounded-lg shadow">
      <h1 className="text-xl font-bold mb-4">World ID Verification</h1>
      <button 
        className={`px-4 py-2 rounded ${
          isVerified 
            ? "bg-green-500 text-white" 
            : "bg-blue-500 text-white hover:bg-blue-600"
        }`} 
        onClick={handleVerify} 
        disabled={isVerified}
      >
        {isVerified ? "Verified ✓" : "Verify with World ID"}
      </button>
      {handleVerifyResponse && !isVerified && (
        <div className="mt-4 p-2 bg-gray-100 rounded overflow-auto max-h-40 text-xs">
          <pre>{JSON.stringify(handleVerifyResponse, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};
