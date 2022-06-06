// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default function handler(req, res) {
  const tokenId = req.query.tokenId;

  const name = `NFT named ${tokenId}`;
  const descp = "This is a minted NFT inside the NFT collection dapp";
  const image = `https://raw.githubusercontent.com/LearnWeb3DAO/NFT-Collection/main/my-app/public/cryptodevs/${Number(tokenId)-1}.svg`

  return res.status(200).json({ 
    name: name,
    descp: descp,
    image: image 
  });
}
