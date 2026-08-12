"use client";

interface QRNameFieldProps {
  name: string;
  onNameChange: (name: string) => void;
}

export function QRNameField({ name, onNameChange }: QRNameFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="qr-name" className="text-sm font-medium text-gray-700">
        QR name
      </label>
      <input
        id="qr-name"
        type="text"
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
        placeholder="My QR code"
        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
      />
    </div>
  );
}
