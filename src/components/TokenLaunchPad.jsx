import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
    createAssociatedTokenAccountInstruction,
  createInitializeMetadataPointerInstruction,
  createInitializeMint2Instruction,
  createInitializeMintInstruction,
  createMint,
  createMintToInstruction,
  ExtensionType,
  getAssociatedTokenAddressSync,
  getMinimumBalanceForRentExemptMint,
  getMintLen,
  LENGTH_SIZE,
  MINT_SIZE,
  TOKEN_2022_PROGRAM_ID,
  TYPE_SIZE,
} from "@solana/spl-token";
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import { createInitializeInstruction, pack } from "@solana/spl-token-metadata";

const TokenLaunchPad = () => {
  const [tokenInfo, setTokenInfo] = useState({
    tokenName: "",
    supply: 0,
    imageUrl: "",
    symbol: "",
  });

  const { connection } = useConnection();
  const userWallet = useWallet();
  const [userMintKeypair,setUserMintKeypair]=useState();
  console.log("connection: ", connection, userWallet);

  const handleTokenInfo = (event) => {
    const { name, value } = event.target;

    if (name === "tokenName") {
      setTokenInfo({ ...tokenInfo, tokenName: value });
    }
    if (name === "symbol") {
      setTokenInfo({ ...tokenInfo, symbol: value });
    }
    if (name === "image") {
      setTokenInfo({ ...tokenInfo, imageUrl: value });
    }
    if (name === "supply") {
      setTokenInfo({ ...tokenInfo, supply: value });
    }
  };

  const createYourToken = async () => {
    // we will bringup the createMint functionality here

    // will check how much lamports are required
    // const lamports = await getMinimumBalanceForRentExemptMint(
    //   connection,
    //   "confirmed"
    // );

    // will create mint account insturction and then initialize that mint account ---
    const mintKeypair=Keypair.generate();
    setUserMintKeypair(mintKeypair);

    const { lamports, metaData, mintLen } = await attachMetaData(mintKeypair);
    console.log("61: ", lamports, metaData, mintLen);

    const instruction1 = SystemProgram.createAccount({
      fromPubkey: userWallet.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      lamports,
      // space: MINT_SIZE,
      space: mintLen,
      programId: TOKEN_2022_PROGRAM_ID,
    });

    //   instuction to initialize the metadata pointer extension
    const instruction2 = createInitializeMetadataPointerInstruction(
        mintKeypair.publicKey,
      userWallet.publicKey,
      mintKeypair.publicKey,
      TOKEN_2022_PROGRAM_ID
    );
    // Instruction to initialize Mint Account data
    //   const instruction3=createInitializeMint2Instruction(
    //     mintKeypair.publicKey,
    //     9,
    //     userWallet.publicKey,
    //     userWallet.publicKey,
    //     TOKEN_2022_PROGRAM_ID
    //   )
    const instruction3 = createInitializeMintInstruction(
        mintKeypair.publicKey,
      9,
      userWallet.publicKey,
      userWallet.publicKey,
      TOKEN_2022_PROGRAM_ID
    );
    // Instruction to initialize metadata account data
    const instuction4 = createInitializeInstruction({
      programId: TOKEN_2022_PROGRAM_ID,
      mint: mintKeypair.publicKey,
      metadata: mintKeypair.publicKey,
      updateAuthority: userWallet.publicKey,
      mintAuthority: userWallet.publicKey,
      name: metaData.name,
      symbol: metaData.symbol,
      uri: metaData.uri,
    });

    const transaction = new Transaction().add(
      instruction1,
      instruction2,
      instruction3,
      instuction4
    );

    // will add recent blockhash ---
    const recentBlockHash = await connection.getLatestBlockhash();
    console.log(
      "transaction: ",
      transaction,
      userWallet.publicKey.toBuffer(),
      recentBlockHash
    );

    transaction.recentBlockhash = recentBlockHash.blockhash;
    transaction.feePayer = userWallet.publicKey;

    // then we will partial sign the transaaction as we dont have payer keypair---

    transaction.partialSign(mintKeypair);

    let res = await userWallet.sendTransaction(transaction, connection);
    console.log("after sending and confirm ..", res);
  };

  const attachMetaData = async (minkeypair) => {
    const mint = minkeypair.publicKey;
    const updateAuthority = userWallet.publicKey;
    const metaData = {
      mint,
      updateAuthority,
      name: tokenInfo.tokenName,
      symbol: tokenInfo.symbol,
      uri: "https://github.com/Lovegupta112/token_launchpad/blob/main/src/assets/metadata.json",
      additionalMetadata: [["description", "Only Possible On Solana"]],
    };
    const metadataExtension = TYPE_SIZE + LENGTH_SIZE;
    // Size of metadata
    const metadataLen = pack(metaData).length;
    // Size of Mint Account with extension
    const mintLen = getMintLen([ExtensionType.MetadataPointer]);
    const lamports = await connection.getMinimumBalanceForRentExemption(
      mintLen + metadataLen + metadataExtension
    );

    return { lamports, metaData, mintLen };
  };

  const mintTheToken=async ()=>{

    //will create ata for given min
   const associatedTokenAddress =  getAssociatedTokenAddressSync(
        userMintKeypair.publicKey,
        userWallet.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      console.log("associatedTokenAddress: ",associatedTokenAddress.toBase58());
  
    // will create associatedTokenAddress instruction --

    const associatedTokenAddressInstruction=createAssociatedTokenAccountInstruction(
        userWallet.publicKey,
        associatedTokenAddress,
        userWallet.publicKey,
        userMintKeypair.publicKey,
        TOKEN_2022_PROGRAM_ID,
    );

    // will create instuction for minting tokens --------
      const transaction1=new Transaction().add(
        associatedTokenAddressInstruction,
    )
    const res1=await userWallet.sendTransaction(transaction1,connection);
    console.log('res1: ',res1)

    const mintoInstruction=createMintToInstruction(
        userMintKeypair.publicKey,
        associatedTokenAddress,
        userWallet.publicKey,
        tokenInfo.supply,
        [],
         TOKEN_2022_PROGRAM_ID
    );

    const transaction2=new Transaction().add(
        mintoInstruction
    )

    const res2=await userWallet.sendTransaction(transaction2,connection);
    console.log('res2: ',res2);

  }

  return (
    <div>
      <h1>TokenLauchPad</h1>
      <input
        type="text"
        name="tokenName"
        placeholder="Enter the token name"
        onChange={handleTokenInfo}
      />
      <br />
      <input
        type="text"
        name="symbol"
        placeholder="Enter the symbol"
        onChange={handleTokenInfo}
      />
      <br />
      <input
        type="number"
        name="supply"
        placeholder="Enter the initial supply"
        onChange={handleTokenInfo}
      />
      <br />
      {/* <input type="file"  name='image' placeholder='uploadImage' onChange={handleTokenInfo}/> */}
      <input
        type="text"
        name="image"
        placeholder="Enter the image url"
        onChange={handleTokenInfo}
      />
      <br />
      <button onClick={createYourToken}>Create Token</button>
      <button onClick={mintTheToken}>Mint Token</button>
    </div>
  );
};

export default TokenLaunchPad;
