import type {
  ConnectionRequest,
  ConnectionResponse,
  ConnectionState,
  ConnectionUser,
  Suggestion,
} from '../models/connection.model';
import { ConnectionStateEnum } from '../models/enums/connection-state.enum';
import type { UserDetails } from '../models/user.model';
import { prisma } from '../server';
import { UserService } from './user.service';

export class ConnectionService {
  static async getConnections(
    userId: string,
    searchString = '',
    numberOf = 999
  ): Promise<ConnectionResponse[]> {
    const connections = await prisma.connection.findMany({
      where: this.getConnectionsWhere(userId, searchString),
      select: this.getConnectionsSelect(),
      take: numberOf,
    });

    const connectionsResponse = connections.map((con) => {
      const isFollower = con.followerId === userId;
      const user = isFollower ? con.following : con.follower;
      return {
        user: this.generateConnectionUser(user),
        userId,
        pending: con.pending,
      };
    });
    return connectionsResponse;
  }

  private static getConnectionsWhere(userId: string, searchString: string) {
    const searchStringClause = searchString?.length
      ? this.collectionSearchStringWhere(searchString)
      : [];

    return {
      AND: [
        {
          OR: [
            { followerId: userId, pending: false },
            { followingId: userId, pending: false },
          ],
        },
        ...searchStringClause,
      ],
    };
  }

  private static collectionSearchStringWhere(searchString: string) {
    return [
      {
        OR: [
          {
            follower: this.searchStringWhere(searchString),
          },
          {
            following: this.searchStringWhere(searchString),
          },
        ],
      },
    ];
  }

  private static getConnectionsSelect() {
    return {
      follower: {
        select: {
          id: true,
          profileImage: true,
          fullName: true,
          username: true,
          email: true,
          bio: true,
          gender: true,
          createdAt: true,
          _count: {
            select: {
              follower: { where: { pending: false } },
              following: { where: { pending: false } },
              posts: { where: { status: { not: 'ARCHIVED' } } },
            },
          },
        },
      },
      following: {
        select: {
          id: true,
          profileImage: true,
          fullName: true,
          username: true,
          email: true,
          bio: true,
          gender: true,
          createdAt: true,
          _count: {
            select: {
              follower: { where: { pending: false } },
              following: { where: { pending: false } },
              posts: true,
            },
          },
        },
      },
      followerId: true,
      followingId: true,
      pending: true,
    };
  }

  private static generateConnectionUser(user: any): ConnectionUser {
    const connectionCount =
      (user._count?.follower || 0) + (user._count?.following || 0);
    const postsCount = user._count?.posts || 0;

    return {
      id: user.id,
      profileImage: user.profileImage,
      fullName: user.fullName,
      username: user.username,
      connectionCount,
      postsCount,
    };
  }

  static async getConnectionRequests(id: string): Promise<ConnectionRequest[]> {
    const connections = await prisma.connection.findMany({
      where: {
        followingId: id,
        pending: true,
      },
      select: this.getConnectionRequestsSelect(),
    });

    return this.generateConnectionRequestsResponse(connections);
  }

  private static getConnectionRequestsSelect() {
    return {
      follower: {
        select: {
          id: true,
          profileImage: true,
          fullName: true,
          username: true,
        },
      },
      followerId: true,
      followingId: true,
      pending: true,
    };
  }

  private static generateConnectionRequestsResponse(connections: any) {
    return connections.map((con: any): ConnectionRequest => {
      const user: UserDetails = {
        id: con.follower.id,
        profileImage: con.follower.profileImage,
        username: con.follower.username,
        fullName: con.follower.fullName,
      };
      return {
        user,
        userId: con.followerId,
        connectionId: con.followingId,
      };
    });
  }

  static async getConnectionState(
    id: string,
    connectionId: string
  ): Promise<ConnectionState> {
    const connection = await prisma.connection.findFirst({
      where: {
        OR: [{ followerId: id }, { followingId: id }],
      },
    });

    return {
      state: this.setConnectionState(connection, id),
      userId: id,
      connectionId,
    };
  }

  static async getSuggestions(
    id: string,
    searchString: string
  ): Promise<Suggestion[]> {
    const users = await prisma.user.findMany({
      where: this.searchStringWhere(searchString ?? ''),
      select: UserService.getUserDetailsQuerySelect(),
    });
    const connections = (await this.getConnections(id)).map(
      (con) => con.user.id
    );
    const suggestions = users.filter((user) => !connections.includes(user.id));

    const response: Suggestion[] = suggestions.map((suggestion) => {
      let foundConnection = suggestion.follower.find(
        (con) => con.followingId === id
      );

      if (!foundConnection) {
        foundConnection = suggestion.following.find(
          (con) => con.followerId === id
        );
      }

      const state = this.setConnectionState(foundConnection, id);
      const user = this.generateConnectionUser(suggestion);

      return {
        user,
        followerId: foundConnection?.followerId,
        followingId: foundConnection?.followingId,
        state,
      };
    });

    return response;
  }

  private static searchStringWhere(searchString: string) {
    return {
      OR: [
        {
          fullName: {
            contains: searchString,
            mode: 'insensitive' as const,
          },
        },
        {
          username: {
            contains: searchString,
            mode: 'insensitive' as const,
          },
        },
      ],
    };
  }

  private static setConnectionState(
    connection: any,
    id: string
  ): ConnectionStateEnum {
    if (
      !connection ||
      (connection.followerId !== id && connection.followingId !== id)
    ) {
      return ConnectionStateEnum.ADD;
    }

    if (!connection.pending) {
      return ConnectionStateEnum.CONNECTED;
    }

    if (connection.followingId === id) {
      return ConnectionStateEnum.ACCEPT;
    }

    return ConnectionStateEnum.REQUEST;
  }
}
