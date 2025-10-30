import { useState } from "react";
import bs58 from "bs58";
import axios from "axios";

interface UserCard {
  name: string;
  rarity: string;
  elementType: string;
  instanceId: string;
  metadataUrl: string;
  skills: any[];
}

export default function HatchEgg({ wallet, eggId }: { wallet: string; eggId: string }) {
  const [mintedCards, setMintedCards] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(false);

  const handleHatchEgg = async () => {
    if (!wallet) return alert("Connect wallet first.");
    setLoading(true);

    try {
      // 1️⃣ Request backend to generate payload
      const payloadRes = await axios.post("http://localhost:3000/api/eggs/payload", {
        wallet,
        eggId,
      });

      const {
        pickedCards,
        cardIds,
        ts,
        adminSignature,
        adminPayload,
        metadataUrl,
        currentHp,
      } = payloadRes.data;

      // 2️⃣ User signs payload using wallet
      const userPayload = JSON.stringify({ wallet, eggId, cardIds, ts });
      const encoded = new TextEncoder().encode(userPayload);
      const sign = await (window as any).solana.signMessage(encoded, "utf8");
      const userSignature = bs58.encode(sign.signature);

      // 3️⃣ Send signed payload back to backend to mint cards
      const hatchRes = await axios.post("http://localhost:3000/api/eggs/hatch", {
        wallet,
        eggId,
        cardIds,
        ts,
        currentHp,
        metadataUrl,
        userPayload,
        userSignature,
        adminPayload,
        adminSignature,
        pickedCards,
      });

      const { instanceIds } = hatchRes.data;

      alert("🎉 Egg hatched successfully! Cards minted on-chain ✅");

      // 4️⃣ Update minted cards with instance IDs
      setMintedCards(
        pickedCards.map((card: UserCard, i: number) => ({
          ...card,
          instanceId: instanceIds[i],
        }))
      );
    } catch (err: any) {
      console.error("❌ Hatch failed:", err);
      alert("Hatch failed: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>🐣 Hatch Egg</h2>
      <button onClick={handleHatchEgg} disabled={loading}>
        {loading ? "Hatching..." : "Hatch Egg"}
      </button>

      {mintedCards.length > 0 && (
        <div>
          <h3>🎴 Minted Cards</h3>
          <ul>
            {mintedCards.map((c, idx) => (
              <li key={idx}>
                <strong>{c.name}</strong> | {c.rarity} | {c.elementType} |
                Instance ID: {c.instanceId} |
                Skills: {c.skills.map((s) => s.name).join(", ")}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
