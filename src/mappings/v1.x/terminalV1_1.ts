import { Bytes } from "@graphprotocol/graph-ts";

import { ProtocolV1Log } from "../../../generated/schema";
import {
  AddToBalance,
  DistributeToPayoutMod,
  DistributeToTicketMod,
  Pay,
  PrintReserveTickets,
  PrintTickets,
  Redeem,
  Tap,
} from "../../../generated/TerminalV1_1/TerminalV1_1";
import { PROTOCOL_ID } from "../../constants";
import { address_v1_terminalV1_1 } from "../../contractAddresses";
import {
  newProtocolV1Log,
  updateProtocolEntity,
} from "../../utils/entities/protocolLog";
import { v1USDPriceForEth } from "../../utils/prices/v1Prices";
import { handleV1AddToBalance } from "../../utils/v1/terminal/addToBalance";
import { handleV1DistributeToPayoutMod } from "../../utils/v1/terminal/distributeToPayoutMod";
import { handleV1DistributeToTicketMod } from "../../utils/v1/terminal/distributeToTicketMod";
import { handleV1Pay } from "../../utils/v1/terminal/pay";
import { handleV1PrintRedeemedTickets } from "../../utils/v1/terminal/printRedeemedTickets";
import { handleV1PrintReserveTickets } from "../../utils/v1/terminal/printReserveTickets";
import { handleV1Redeem } from "../../utils/v1/terminal/redeem";
import { handleV1Tap } from "../../utils/v1/terminal/tap";

const terminal: Bytes = Bytes.fromHexString(address_v1_terminalV1_1!);

export function handlePay(event: Pay): void {
  const amountUSD = v1USDPriceForEth(event.params.amount);

  handleV1Pay(
    event,
    event.params.projectId,
    event.params.amount,
    amountUSD,
    terminal,
    event.params.beneficiary,
    event.params.note,
    event.params.caller
  );

  let protocolV1Log = ProtocolV1Log.load(PROTOCOL_ID);
  if (!protocolV1Log) protocolV1Log = newProtocolV1Log();
  if (protocolV1Log) {
    protocolV1Log.volumePaid = protocolV1Log.volumePaid.plus(
      event.params.amount
    );
    if (amountUSD) {
      protocolV1Log.volumePaidUSD = protocolV1Log.volumePaidUSD.plus(amountUSD);
    }
    protocolV1Log.paymentsCount = protocolV1Log.paymentsCount + 1;
    protocolV1Log.save();
  }
  updateProtocolEntity();
}

export function handlePrintTickets(event: PrintTickets): void {
  handleV1PrintRedeemedTickets(
    event,
    event.params.projectId,
    event.params.amount,
    event.params.beneficiary,
    event.params.memo,
    event.params.caller,
    terminal
  );
}

export function handleTap(event: Tap): void {
  handleV1Tap(
    event,
    event.params.projectId,
    event.params.amount,
    event.params.beneficiaryTransferAmount,
    event.params.govFeeAmount,
    event.params.netTransferAmount,
    event.params.beneficiary,
    event.params.currency,
    event.params.fundingCycleId,
    event.params.caller,
    terminal
  );
}

export function handleRedeem(event: Redeem): void {
  handleV1Redeem(
    event,
    event.params._projectId,
    event.params.amount,
    event.params.returnAmount,
    terminal,
    event.params.beneficiary,
    event.params.holder,
    event.params.caller
  );

  const returnAmountUSD = v1USDPriceForEth(event.params.returnAmount);
  let protocolV1Log = ProtocolV1Log.load(PROTOCOL_ID);
  if (!protocolV1Log) protocolV1Log = new ProtocolV1Log(PROTOCOL_ID);
  if (protocolV1Log) {
    protocolV1Log.volumeRedeemed = protocolV1Log.volumeRedeemed.plus(
      event.params.returnAmount
    );
    if (returnAmountUSD) {
      protocolV1Log.volumeRedeemedUSD = protocolV1Log.volumeRedeemedUSD.plus(
        returnAmountUSD
      );
    }
    protocolV1Log.redeemCount = protocolV1Log.redeemCount + 1;
    protocolV1Log.save();
  }
  updateProtocolEntity();
}

export function handlePrintReserveTickets(event: PrintReserveTickets): void {
  handleV1PrintReserveTickets(
    event,
    event.params.projectId,
    event.params.beneficiary,
    event.params.beneficiaryTicketAmount,
    event.params.count,
    event.params.fundingCycleId,
    event.params.caller,
    terminal
  );
}

export function handleAddToBalance(event: AddToBalance): void {
  handleV1AddToBalance(
    event,
    event.params.projectId,
    event.params.value,
    terminal,
    event.params.caller
  );
}

export function handleDistributeToPayoutMod(
  event: DistributeToPayoutMod
): void {
  handleV1DistributeToPayoutMod(
    event,
    event.params.projectId,
    event.params.fundingCycleId,
    event.params.mod.projectId,
    event.params.mod.beneficiary,
    event.params.mod.allocator,
    event.params.mod.preferUnstaked,
    event.params.modCut,
    event.params.caller,
    terminal
  );
}

export function handleDistributeToTicketMod(
  event: DistributeToTicketMod
): void {
  handleV1DistributeToTicketMod(
    event,
    event.params.projectId,
    event.params.fundingCycleId,
    event.params.mod.beneficiary,
    event.params.mod.preferUnstaked,
    event.params.modCut,
    event.params.caller,
    terminal
  );
}
