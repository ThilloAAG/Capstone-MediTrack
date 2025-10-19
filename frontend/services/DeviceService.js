export const dispenseNow = async (deviceId) => {
  await fetch(`https://api.monserveur.com/devices/${deviceId}/dispense`, { method: "POST" });
};

export const sendEmergency = async (userId) => {
  await fetch(`https://api.monserveur.com/users/${userId}/emergency`, { method: "POST" });
};
