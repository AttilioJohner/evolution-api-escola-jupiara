-- CreateEnum
CREATE TYPE "InstanceConnectionStatus" AS ENUM ('open', 'close', 'connecting');

-- CreateEnum  
CREATE TYPE "DeviceMessage" AS ENUM ('ios', 'android', 'web', 'unknown', 'desktop');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('opened', 'closed', 'paused'); 

-- CreateEnum
CREATE TYPE "TriggerType" AS ENUM ('all', 'keyword', 'none', 'advanced');

-- CreateEnum
CREATE TYPE "TriggerOperator" AS ENUM ('contains', 'equals', 'startsWith', 'endsWith', 'regex');

-- CreateEnum
CREATE TYPE "OpenaiBotType" AS ENUM ('assistant', 'chatCompletion');

-- CreateEnum
CREATE TYPE "DifyBotType" AS ENUM ('chatBot', 'textGenerator', 'agent', 'workflow');

-- AlterTable (Baseline migration - tables already exist)
-- This is a baseline migration generated from existing database state
-- No actual changes needed as tables already exist in production
