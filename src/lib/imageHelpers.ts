export const useImageHelpers = () => {
  const fetchImage = async (url: any) => {
    const response = await fetch(url);

    const arrayBuffer = await response.arrayBuffer();
    console.log(arrayBuffer);
    return new Uint8Array(arrayBuffer);
  };

  return { fetchImage };
};
