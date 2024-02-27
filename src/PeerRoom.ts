/* Credit
    AntonNevsgodov <nevzgodov.anton@gmail.com>
*/

import { DataConnection, Peer } from 'peerjs'

type DataEventData =
    | { type: 'members-list', message: string[] }
    | { type: 'chat' | 'announce', message: string }
    | { type: 'player_state' | 'bullet_shot' | 'bullet_collided' | 'kill', message: any }
    | { type: 'player-disconnected', message: null }

export class PeerRoom {
    private members: DataConnection[] = [];
    private peer: Peer;
    private unloadListener = () => this.destroy();

    private listeners: ((address: string, data: DataEventData) => void)[] = []

    constructor(private userId: string) {
        this.peer = new Peer(userId);
        this.peer.on('connection', (member) => this.addDataConnectionEventHandlers(member));
        window.addEventListener('beforeunload', this.unloadListener)
    }

    private emit(address: string, data: DataEventData) {
        this.listeners.forEach((listener) => listener(address, data));
    }

    private addDataConnectionEventHandlers(dc: DataConnection) {
        dc.on('open', () => {
            this.members.push(dc);
            dc.send({ type: 'members-list', message: this.members.map((m) => m.peer).filter(p => p !== dc.peer) });
            this.emit(dc.peer, { type: 'announce', message: dc.peer });
        });

        dc.on('close', () => {
            this.members = this.members.filter((m) => m !== dc);
            this.emit(dc.peer, { type: 'player-disconnected', message: null })
        });

        dc.on('data', ((data: DataEventData) => {
            if (data.type === 'members-list') {
                data.message.forEach((peer) => {
                    if (!this.members.some(m => m.peer === peer)) {
                        const dc = this.peer.connect(peer);
                        this.addDataConnectionEventHandlers(dc);
                    };
                })
                return;
            }

            this.emit(dc.peer, data);
        }) as (data: unknown) => void)

        dc.on('error', () => {
            console.log('error');
        })
    }

    connectToMember(userId: string) {
        this.peer.once('open', () => {
            const dc = this.peer.connect(userId);
            this.addDataConnectionEventHandlers(dc);
        })
    }

    destroy() {
        this.peer.destroy();
        window.removeEventListener('beforeunload', this.unloadListener)
    }

    address() {
        return this.userId;
    }

    on(event: 'message', listener: (address: string, data: DataEventData) => void) {
        this.listeners.push(listener);
    }

    send(arg: any) {
        this.listeners.forEach(l => l(this.userId, arg))
        this.members.forEach(m => m.send(arg))
    }
}