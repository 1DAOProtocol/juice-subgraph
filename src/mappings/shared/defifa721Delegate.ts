import { Address, Bytes, log } from "@graphprotocol/graph-ts";

import { JB721DelegateToken, Participant } from "../../../generated/schema";
import {
  JB721Delegate,
  Transfer,
} from "../../../generated/templates/JB721Delegate/JB721Delegate";
import {
  address_shared_defifa721Delegate,
  address_shared_jbTiered721DelegateStore,
} from "../../contractAddresses";
import { JB721GovernanceType, PV } from "../../enums";
import { newParticipant } from "../../utils/entities/participant";
import {
  idForJB721DelegateToken,
  idForParticipant,
  idForProject,
} from "../../utils/ids";

const pv = PV.PV2;

export function handleTransfer(event: Transfer): void {
  const address = Bytes.fromHexString(
    address_shared_defifa721Delegate as string
  );
  const jb721DelegateContract = JB721Delegate.bind(Address.fromBytes(address));

  // projectId
  const projectIdCall = jb721DelegateContract.try_projectId();
  if (projectIdCall.reverted) {
    log.error("[handleTransfer] jb721Delegate.projectId() reverted", []);
    return;
  }
  const projectId = projectIdCall.value;

  const tokenId = event.params.tokenId;

  const id = idForJB721DelegateToken(Address.fromBytes(address), tokenId);

  let token = JB721DelegateToken.load(id);

  /**
   * If entity doesn't exist, we create and get the values that aren't expected to change.
   */
  if (!token) {
    // Create entity
    token = new JB721DelegateToken(id);
    token.tokenId = tokenId;
    token.address = address;
    token.projectId = projectId.toI32();
    token.governanceType = JB721GovernanceType.TIERED;
    token.project = idForProject(projectId, pv);

    // Name
    const nameCall = jb721DelegateContract.try_name();
    if (nameCall.reverted) {
      log.error("[handleTransfer] jb721Delegate.name() reverted: {}", [id]);
      return;
    }
    token.name = nameCall.value;

    // Symbol
    const symbolCall = jb721DelegateContract.try_symbol();
    if (symbolCall.reverted) {
      log.error("[handleTransfer] symbol() reverted for jb721Delegate:{}", [
        id,
      ]);
      return;
    }
    token.symbol = symbolCall.value;

    // Tier data
    if (!address_shared_jbTiered721DelegateStore) {
      log.error(
        "[handleTransfer] missing address_shared_jbTiered721DelegateStore",
        []
      );
      return;
    }
  }

  /**
   * Some params may change, so we update them every time the token
   * is transferred.
   */
  const tokenUriCall = jb721DelegateContract.try_tokenURI(tokenId);
  if (tokenUriCall.reverted) {
    log.error("[handleTransfer] jb721Delegate.tokenURI() reverted:{}", [
      id,
    ]);
    return;
  }
  token.tokenUri = tokenUriCall.value;

  const receiverId = idForParticipant(projectId, pv, event.params.to);

  token.owner = receiverId;
  token.save();

  // Create participant if doesn't exist
  let receiver = Participant.load(receiverId);
  if (!receiver) receiver = newParticipant(pv, projectId, event.params.to);
  
  receiver.save();
}
