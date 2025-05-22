export async function fetchNetworkData(file: File) {
    const formData = new FormData();
    formData.append("file", file);
   
    if (file.name.endsWith(".h5")) {
      try {
         const response = await fetch("http://localhost:4000/tensorflow", {
            method: "POST",
            body: formData,
         });
   
         if (!response.ok) throw new Error("Failed to fetch network data");
   
         return await response.json();
      } catch (error) {
         console.error("Error fetching network data:", error);
         throw error;
      }
   }
   else if (file.name.endsWith(".pt")) {
      try {
         const response = await fetch("http://localhost:4000/pytorch", {
            method: "POST",
            body: formData,
         });
   
         if (!response.ok) throw new Error("Failed to fetch network data");
   
         return await response.json();
      } catch (error) {
         console.error("Error fetching network data:", error);
         throw error;
      }
   }
}
 