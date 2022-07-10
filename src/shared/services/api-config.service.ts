import { TSMigrationGenerator } from '@mikro-orm/migrations';
import type { MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs/typings';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isNil } from 'lodash';
import path from 'path';
import { Configuration } from '@mikro-orm/core';

@Injectable()
export class ApiConfigService {
  constructor(private configService: ConfigService) {}

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isTest(): boolean {
    return this.nodeEnv === 'test';
  }

  private getNumber(key: string): number {
    const value = this.get(key);

    try {
      return Number(value);
    } catch {
      throw new Error(key + ' environment variable is not a number');
    }
  }

  private getBoolean(key: string): boolean {
    const value = this.get(key);

    try {
      return Boolean(JSON.parse(value));
    } catch {
      throw new Error(key + ' env var is not a boolean');
    }
  }

  private getString(key: string): string {
    const value = this.get(key);

    return value.replace(/\\n/g, '\n');
  }

  get nodeEnv(): string {
    return this.getString('NODE_ENV');
  }

  get fallbackLanguage(): string {
    return this.getString('FALLBACK_LANGUAGE');
  }

  get postgresConfig(): MikroOrmModuleSyncOptions {
    const entities = [
      __dirname + '/../../modules/**/*.entity.js',
      __dirname + '/../../modules/**/*.view-entity.js',
    ];
    const entitiesTs = [
      __dirname + '/../../modules/**/*.entity.ts',
      __dirname + '/../../modules/**/*.view-entity.ts',
    ];

    return {
      type: this.getString('DB_TYPE') as keyof typeof Configuration.PLATFORMS,
      name: 'default',
      host: this.getString('DB_HOST'),
      port: this.getNumber('DB_PORT'),
      user: this.getString('DB_USERNAME'),
      password: this.getString('DB_PASSWORD'),
      dbName: this.getString('DB_DATABASE'),
      debug: this.getBoolean('ENABLE_ORM_LOGS'),
      entities,
      entitiesTs,
      // metadataProvider: TsMorphMetadataProvider,
      migrations: {
        tableName: 'orm_migrations',
        path: path.resolve(__dirname + '/../../database/migrations/*.js'),
        pathTs: path.resolve(__dirname + '/../../database/migrations/*.ts'),
        glob: '!(*.d).{js,ts}',
        transactional: true,
        disableForeignKeys: true,
        allOrNothing: true,
        dropTables: true,
        safe: false,
        snapshot: true,
        emit: 'ts',
        generator: TSMigrationGenerator,
      },
      // subscribers: [UserSubscriber],
      // migrationsRun: true,
      // logging: this.getBoolean('ENABLE_ORM_LOGS'),
      // namingStrategy: new SnakeNamingStrategy(),
    };
  }

  get awsS3Config() {
    return {
      bucketRegion: this.getString('AWS_S3_BUCKET_REGION'),
      bucketApiVersion: this.getString('AWS_S3_API_VERSION'),
      bucketName: this.getString('AWS_S3_BUCKET_NAME'),
    };
  }

  get documentationEnabled(): boolean {
    return this.getBoolean('ENABLE_DOCUMENTATION');
  }

  get natsEnabled(): boolean {
    return this.getBoolean('NATS_ENABLED');
  }

  get natsConfig() {
    return {
      host: this.getString('NATS_HOST'),
      port: this.getNumber('NATS_PORT'),
    };
  }

  get authConfig() {
    return {
      privateKey: this.getString('JWT_PRIVATE_KEY'),
      publicKey: this.getString('JWT_PUBLIC_KEY'),
      jwtExpirationTime: this.getNumber('JWT_EXPIRATION_TIME'),
    };
  }

  get appConfig() {
    return {
      port: this.getString('PORT'),
    };
  }

  private get(key: string): string {
    const value = this.configService.get<string>(key);

    if (isNil(value)) {
      throw new Error(key + ' environment variable does not set'); // probably we should call process.exit() too to avoid locking the service
    }

    return value;
  }
}
