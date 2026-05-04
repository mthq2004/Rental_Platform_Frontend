import SocketService from './socket.service'
import { AppDispatch } from '@/store'
import { getMyContracts as getMyContractsThunk, getContractDetail as getContractDetailThunk } from '@/store/slices/contract.slice'

class ContractSocket {
  private dispatch: AppDispatch | null = null

  init(dispatch: AppDispatch) {
    this.dispatch = dispatch

    SocketService.connect().then(() => {
      // Events: rental_request.updated, holding_deposit.paid, contract.created, contract.updated
      SocketService.on('rental_request.updated', (payload: any) => {
        console.log('socket rental_request.updated', payload)
        // refresh my requests/contracts
        if (this.dispatch) this.dispatch(getMyContractsThunk())
      })

      SocketService.on('holding_deposit.paid', (payload: any) => {
        console.log('socket holding_deposit.paid', payload)
        if (this.dispatch) this.dispatch(getMyContractsThunk())
      })

      SocketService.on('contract.created', (payload: any) => {
        console.log('socket contract.created', payload)
        if (this.dispatch) this.dispatch(getMyContractsThunk())
      })

      SocketService.on('contract.updated', (payload: any) => {
        console.log('socket contract.updated', payload)
        // if contractId provided, update detail
        if (this.dispatch) {
          if (payload?.contractId) {
            this.dispatch(getContractDetailThunk(payload.contractId))
          } else {
            this.dispatch(getMyContractsThunk())
          }
        }
      })
    }).catch(e => console.warn('Socket init failed', e))
  }

  destroy() {
    SocketService.disconnect()
    this.dispatch = null
  }
}

export default new ContractSocket()
