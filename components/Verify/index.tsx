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
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check if already verified on load
  useEffect(() => {
    const checkCookie = () => {
      try {
        const cookies = document.cookie.split(';');
        const verifiedCookie = cookies.find(cookie => cookie.trim().startsWith('world-id-verified='));
        const verified = verifiedCookie?.includes('true') || false;
        
        console.log("Checking World ID verification cookie:", verified);
        setIsVerified(verified);
        
        // If already verified, dispatch event for other components to know
        if (verified) {
          console.log("Dispatching world-id-verified event (from load)");
          window.dispatchEvent(new CustomEvent('world-id-verified', { detail: true }));
        }
      } catch (error) {
        console.error("Error checking verification cookie:", error);
      }
    };
    
    checkCookie();
  }, []);

  const setVerificationStatus = useCallback((verified: boolean) => {
    try {
      // Set verified status
      setIsVerified(verified);
      
      if (verified) {
        // Set a cookie to persist the verification (expires in 1 hour)
        document.cookie = "world-id-verified=true; path=/; max-age=3600"; 
        
        // Store in localStorage as backup
        localStorage.setItem('world-id-verified', 'true');
        
        // Dispatch a custom event that verification succeeded
        console.log("Dispatching world-id-verified event");
        window.dispatchEvent(new CustomEvent('world-id-verified', { detail: true }));
      }
    } catch (error) {
      console.error("Error setting verification status:", error);
    }
  }, []);

  const handleVerify = useCallback(async () => {
    try {
      setIsVerifying(true);
      setErrorMessage(null);
      
      if (!MiniKit.isInstalled()) {
        console.warn("World ID App is not installed. Please install World ID first.");
        setErrorMessage("World ID App is not installed. Please install World ID first.");
        setIsVerifying(false);
        return null;
      }

      console.log("Starting World ID verification process...");
      const { finalPayload } = await MiniKit.commandsAsync.verify(verifyPayload);

      // no need to verify if command errored
      if (finalPayload.status === "error") {
        console.log("World ID verification command error:", finalPayload);
        setHandleVerifyResponse(finalPayload);
        setErrorMessage(`Verification error: ${(finalPayload as any).reason || "Unknown error"}`);
        setIsVerifying(false);
        return finalPayload;
      }

      console.log("Verifying World ID proof on backend...");
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
        console.log("World ID verification success!");
        
        // Set verified status and store in cookie
        setVerificationStatus(true);
        
        // Clear response message on successful verification
        setHandleVerifyResponse(null);
        setIsVerifying(false);
        
        return verifyResponseJson;
      }

      console.log("World ID verification failed:", verifyResponseJson);
      setHandleVerifyResponse(verifyResponseJson);
      setErrorMessage(`Verification failed: ${verifyResponseJson.message || "Unknown error"}`);
      setIsVerifying(false);
      return verifyResponseJson;
    } catch (error) {
      console.error("Error in verification process:", error);
      setErrorMessage(`Verification error: ${error instanceof Error ? error.message : "Unknown error"}`);
      setIsVerifying(false);
      return null;
    }
  }, [setVerificationStatus]);

  return (
    <div className="w-full max-w-md p-4 bg-white rounded-lg shadow">
      <h1 className="text-xl font-bold mb-4">World ID Verification</h1>
      
      {isVerifying && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
          <span>Verifying...</span>
        </div>
      )}
      
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}
      
      <button 
        className={`w-full px-4 py-3 rounded-lg ${
          isVerified 
            ? "bg-green-500 text-white" 
            : "bg-blue-500 text-white hover:bg-blue-600"
        }`} 
        onClick={handleVerify} 
        disabled={isVerified || isVerifying}
      >
        <div className="flex items-center justify-center gap-2">
          {isVerified ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Verified with World ID</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Verify with World ID</span>
            </>
          )}
        </div>
      </button>
      
      {handleVerifyResponse && !isVerified && (
        <div className="mt-4 p-2 bg-gray-100 rounded overflow-auto max-h-40 text-xs">
          <pre>{JSON.stringify(handleVerifyResponse, null, 2)}</pre>
        </div>
      )}
      
      {isVerified && (
        <div className="mt-4 p-3 bg-green-50 border border-green-100 text-green-700 rounded-lg text-sm">
          Your World ID has been verified. You can now contribute data.
        </div>
      )}
    </div>
  );
};
