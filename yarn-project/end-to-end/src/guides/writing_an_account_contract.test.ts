import { DefaultAccountContract } from '@aztec/accounts/defaults';
import {
  AccountManager,
  AuthWitness,
  type AuthWitnessProvider,
  type CompleteAddress,
  Fr,
  GrumpkinScalar,
  Schnorr,
} from '@aztec/aztec.js';
import { SchnorrHardcodedAccountContractArtifact } from '@aztec/noir-contracts.js/SchnorrHardcodedAccount';
import { TokenContract } from '@aztec/noir-contracts.js/Token';

import { setup } from '../fixtures/utils.js';

// docs:start:account-contract
const PRIVATE_KEY = GrumpkinScalar.fromHexString('0xd35d743ac0dfe3d6dbe6be8c877cb524a00ab1e3d52d7bada095dfc8894ccfa');

/** Account contract implementation that authenticates txs using Schnorr signatures. */
class SchnorrHardcodedKeyAccountContract extends DefaultAccountContract {
  constructor(private privateKey = PRIVATE_KEY) {
    super(SchnorrHardcodedAccountContractArtifact);
  }

  getDeploymentArgs() {
    // This contract has no constructor
    return Promise.resolve(undefined);
  }

  getAuthWitnessProvider(_address: CompleteAddress): AuthWitnessProvider {
    const privateKey = this.privateKey;
    return {
      async createAuthWit(messageHash: Fr): Promise<AuthWitness> {
        const signer = new Schnorr();
        const signature = await signer.constructSignature(messageHash.toBuffer(), privateKey);
        return Promise.resolve(new AuthWitness(messageHash, [...signature.toBuffer()]));
      },
    };
  }
}
// docs:end:account-contract

describe('guides/writing_an_account_contract', () => {
  let context: Awaited<ReturnType<typeof setup>>;

  beforeEach(async () => {
    context = await setup(0);
  });

  afterEach(() => context.teardown());

  it('works', async () => {
    const { pxe, logger } = context;
    // docs:start:account-contract-deploy
    const secretKey = Fr.random();
    const account = await AccountManager.create(pxe, secretKey, new SchnorrHardcodedKeyAccountContract());
    const wallet = await account.waitSetup();
    const address = wallet.getCompleteAddress().address;
    // docs:end:account-contract-deploy
    logger.info(`Deployed account contract at ${address}`);

    // docs:start:account-contract-works
    const token = await TokenContract.deploy(wallet, address, 'TokenName', 'TokenSymbol', 18).send().deployed();
    logger.info(`Deployed token contract at ${token.address}`);

    const mintAmount = 50n;
    const from = address; // we are setting from to address here because of TODO(#9887)
    await token.methods.mint_to_private(from, address, mintAmount).send().wait();

    const balance = await token.methods.balance_of_private(address).simulate();
    logger.info(`Balance of wallet is now ${balance}`);
    // docs:end:account-contract-works
    expect(balance).toEqual(50n);

    // docs:start:account-contract-fails
    const wrongKey = GrumpkinScalar.random();
    const wrongAccountContract = new SchnorrHardcodedKeyAccountContract(wrongKey);
    const wrongAccount = await AccountManager.create(pxe, secretKey, wrongAccountContract, account.salt);
    const wrongWallet = await wrongAccount.getWallet();
    const tokenWithWrongWallet = token.withWallet(wrongWallet);

    try {
      await tokenWithWrongWallet.methods.mint_to_public(address, 200).prove();
    } catch (err) {
      logger.info(`Failed to send tx: ${err}`);
    }
    // docs:end:account-contract-fails
  });
});
