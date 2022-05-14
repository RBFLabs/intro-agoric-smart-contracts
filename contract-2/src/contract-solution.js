// Eventually will be importable from '@agoric/zoe-contract-support'
import { AssetKind, AmountMath } from '@agoric/ertp'
import { assertProposalShape, assertIssuerKeywords } from '@agoric/zoe/src/contractSupport/index.js'
import { Far } from '@endo/marshal';


/**
 * Example contract that knows how to
 * 1. mint some Moolas (faucet) and provide them to the user
 * 1. mint some NFTs
 * 2. sell the NFTs for moolas
 */
const start = async (zcf) => {
    assertIssuerKeywords(zcf, ['Tokens'])
    const { Moola: moolaIssuer } = zcf.getTerms()

    const nftMint = await zcf.makeZCFMint('Awesomez', AssetKind.SET)
    const { issuer: nftIssuer } = nftMint.getIssuerRecord()

    const { zcfSeat: nftSeat } = zcf.makeEmptySeatKit()

    const mintNFTs = (seat) => {
        assertProposalShape(seat, {
            want: { Awesomez: null },
            give: { Tokens: null }
        })

        const { want: userWants, give: userGives } = seat.getProposal()

        if (AmountMath.isGTE(AmountMath.make(moolaIssuer.getBrand(), 99n), userGives.Tokens)) {
            seat.fail()
            return 'Your offer is not good enough'
        }

        nftMint.mintGains(userWants, nftSeat)

        nftSeat.incrementBy(userGives)
        nftSeat.decrementBy(userWants)

        seat.incrementBy(userWants)
        seat.decrementBy(userGives)

        zcf.reallocate(nftSeat, seat)

        seat.exit()

        return 'You minted an NFT!'
    }

    const creatorFacet = {
        // getBalance solution is secret :)
        // getProfit solution is secret :)
    }

    // we allow the public facet minting functionality as well
    const publicFacet = {
        makeMintNFTsInvitation: () => zcf.makeInvitation(mintNFTs, 'mintNFTs'),
        getNFTIssuer: () => nftIssuer,
    }

    return harden({ creatorFacet: Far('creatorFacet', creatorFacet), publicFacet: Far('publicFacet', publicFacet) });
};

harden(start);
export { start };