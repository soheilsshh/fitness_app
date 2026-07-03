// src/app/(panel)/admin/users/[id]/_components/userBodyMock.js

export const userBodyMockByUserId = {
  u1: {
    heightCm: 178,
    weightKg: 78,
    photos: [
      { id: "p1", url: "https://picsum.photos/seed/u1p1/900/700", name: "Front" },
      { id: "p2", url: "https://picsum.photos/seed/u1p2/900/700", name: "Side" },
      { id: "p3", url: "https://picsum.photos/seed/u1p3/900/700", name: "Back" },
    ],
  },
  u2: {
    heightCm: 165,
    weightKg: 62,
    photos: [{ id: "p1", url: "https://picsum.photos/seed/u2p1/900/700", name: "Front" }],
  },
};
