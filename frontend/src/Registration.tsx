import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Registration = () => {
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [occupation, setOccupation] = useState<string>("");
  const [residence, setResidence] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<string>(""); // NEW: to store if it's pdf/image
  const [loading, setLoading] = useState<boolean>(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return alert("Please select a file to upload.");
    setLoading(true);

    try {
      const fileFormData = new FormData();
      fileFormData.append("file", file);

      // Upload file first
      const uploadRes = await fetch("/api/uploadFile", {
        method: "POST",
        body: fileFormData,
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json().catch(() => ({}));
        throw new Error(errData.error || "File upload failed.");
      }

      const uploadData = await uploadRes.json();
      const fileUrl: string = uploadData.fileUrl;
      const uploadedType: string = uploadData.type; // "pdf" or "image"

      // Prepare user data
      const registrationData = {
        firstName,
        lastName,
        occupation,
        residence,
        fileUrl,
        fileType: uploadedType,
      };

      const registrationRes = await fetch("/api/registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationData),
      });

      if (!registrationRes.ok) {
        const regData = await registrationRes.json().catch(() => ({}));
        throw new Error(regData.error || "Registration failed.");
      }

      navigate("/success");
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
      else alert("Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      setFile(selectedFile);
      setFileType(selectedFile.type); // store MIME type for display
    } else {
      setFile(null);
      setFileType("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <form
        onSubmit={handleSubmit}
        className="bg-emerald-500 p-6 rounded-lg shadow-lg w-full max-w-md space-y-4"
      >
        <h1 className="text-2xl font-bold text-center text-white">
          Register & Upload File
        </h1>

        <input
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />
        <input
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />
        <input
          type="text"
          placeholder="Occupation"
          value={occupation}
          onChange={(e) => setOccupation(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />
        <input
          type="text"
          placeholder="Residence area"
          value={residence}
          onChange={(e) => setResidence(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />
        <input
          type="file"
          accept="application/pdf,image/*"
          onChange={handleFileChange}
          className="w-full border p-2 rounded"
          required
          aria-label="Upload File"
        />

        {file && (
          <p className="text-sm text-white text-center">
            Selected: {file.name} ({fileType || "unknown type"})
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full text-white py-2 rounded ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
};

export default Registration;
