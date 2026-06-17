async function createUser(){

  const res = await fetch(
    GAS_URL,
    {
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        action:"createUser"
      })
    }
  );

  const data = await res.json();

  location.href =
    `?id=${data.userId}`;
}
async function uploadImage(file){

  const userId =
    new URLSearchParams(
      location.search
    ).get("id");

  const fd = new FormData();

  fd.append(
    "file",
    file
  );

  fd.append(
    "upload_preset",
    UPLOAD_PRESET
  );

  fd.append(
    "folder",
    `users/${userId}`
  );

  const res =
    await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method:"POST",
        body:fd
      }
    );

  return await res.json();
}
