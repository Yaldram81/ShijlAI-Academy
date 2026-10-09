-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `avatar` LONGTEXT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'student',
    `bio` VARCHAR(191) NULL,
    `language` VARCHAR(191) NOT NULL DEFAULT 'en',
    `xp` INTEGER NOT NULL DEFAULT 0,
    `level` INTEGER NOT NULL DEFAULT 1,
    `shijlCoins` INTEGER NOT NULL DEFAULT 0,
    `streak` INTEGER NOT NULL DEFAULT 0,
    `longestStreak` INTEGER NOT NULL DEFAULT 0,
    `lastActiveAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `passwordHash` VARCHAR(191) NULL,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `mfaEnabled` BOOLEAN NOT NULL DEFAULT false,
    `mfaSecret` VARCHAR(191) NULL,
    `otpCode` VARCHAR(191) NULL,
    `otpExpiresAt` DATETIME(3) NULL,
    `resetToken` VARCHAR(191) NULL,
    `resetTokenExpiresAt` DATETIME(3) NULL,
    `loginAttempts` INTEGER NOT NULL DEFAULT 0,
    `lockedUntil` DATETIME(3) NULL,
    `authProvider` VARCHAR(191) NOT NULL DEFAULT 'email',
    `phone` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `flaggedReason` VARCHAR(191) NULL,
    `adminNotes` MEDIUMTEXT NULL,
    `lastLoginAt` DATETIME(3) NULL,
    `lastLoginIp` VARCHAR(191) NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ActivityLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `icon` VARCHAR(191) NOT NULL DEFAULT '≡ƒôï',
    `metadata` MEDIUMTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `action` VARCHAR(191) NOT NULL DEFAULT 'generic',
    `targetName` VARCHAR(191) NULL,
    `targetType` VARCHAR(191) NULL,
    `targetId` VARCHAR(191) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `severity` VARCHAR(191) NOT NULL DEFAULT 'info',
    `category` VARCHAR(191) NOT NULL DEFAULT 'admin_action',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InstructorApplication` (
    `id` VARCHAR(191) NOT NULL,
    `applicationCode` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `expertise` VARCHAR(191) NOT NULL,
    `experience` VARCHAR(191) NOT NULL,
    `motivation` VARCHAR(191) NOT NULL,
    `linkedinProfile` VARCHAR(191) NULL,
    `portfolioUrl` VARCHAR(191) NULL,
    `sampleLessonDesc` VARCHAR(191) NULL,
    `teachingApproach` VARCHAR(191) NULL,
    `expectedTimeline` VARCHAR(191) NULL,
    `resumeUrl` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `adminNotes` MEDIUMTEXT NULL,
    `reviewedAt` DATETIME(3) NULL,
    `reviewedBy` VARCHAR(191) NULL,
    `rejectionReason` VARCHAR(191) NULL,
    `rejectionFeedback` VARCHAR(191) NULL,
    `canReapply` BOOLEAN NOT NULL DEFAULT true,
    `reapplyAfter` DATETIME(3) NULL,
    `evaluationScore` DOUBLE NULL,
    `evaluationCriteria` MEDIUMTEXT NULL,
    `evaluationNotes` VARCHAR(191) NULL,
    `confirmationEmailSent` BOOLEAN NOT NULL DEFAULT false,
    `confirmationEmailSentAt` DATETIME(3) NULL,
    `reviewEmailSent` BOOLEAN NOT NULL DEFAULT false,
    `interviewEmailSent` BOOLEAN NOT NULL DEFAULT false,
    `decisionEmailSent` BOOLEAN NOT NULL DEFAULT false,
    `onboardingEmailSent` BOOLEAN NOT NULL DEFAULT false,
    `infoRequestMessage` VARCHAR(191) NULL,
    `infoProvidedAt` DATETIME(3) NULL,
    `infoProvidedData` MEDIUMTEXT NULL,
    `onboardedAt` DATETIME(3) NULL,
    `onboardingChecklist` MEDIUMTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `userId` VARCHAR(191) NULL,

    UNIQUE INDEX `InstructorApplication_applicationCode_key`(`applicationCode`),
    UNIQUE INDEX `InstructorApplication_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ApplicationTimeline` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `event` VARCHAR(191) NOT NULL,
    `fromStatus` VARCHAR(191) NULL,
    `toStatus` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `performedBy` VARCHAR(191) NULL,
    `performedByName` VARCHAR(191) NULL,
    `metadata` MEDIUMTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ApplicationTimeline_applicationId_idx`(`applicationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ApplicationInterview` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `interviewType` VARCHAR(191) NOT NULL DEFAULT 'video_call',
    `scheduledAt` DATETIME(3) NOT NULL,
    `duration` INTEGER NOT NULL DEFAULT 30,
    `meetingUrl` VARCHAR(191) NULL,
    `meetingId` VARCHAR(191) NULL,
    `meetingPassword` VARCHAR(191) NULL,
    `location` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'scheduled',
    `interviewerId` VARCHAR(191) NULL,
    `interviewerName` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `feedback` MEDIUMTEXT NULL,
    `feedbackScore` DOUBLE NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ApplicationInterview_applicationId_idx`(`applicationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Course` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `level` VARCHAR(191) NOT NULL DEFAULT 'beginner',
    `language` VARCHAR(191) NOT NULL DEFAULT 'en',
    `thumbnail` VARCHAR(191) NULL,
    `price` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `isPublished` BOOLEAN NOT NULL DEFAULT false,
    `isArchived` BOOLEAN NOT NULL DEFAULT false,
    `enrollmentCount` INTEGER NOT NULL DEFAULT 0,
    `rating` DOUBLE NOT NULL DEFAULT 0,
    `learningObjectives` MEDIUMTEXT NULL,
    `prerequisites` MEDIUMTEXT NULL,
    `targetAudience` VARCHAR(191) NULL,
    `tags` MEDIUMTEXT NULL,
    `estimatedDuration` INTEGER NOT NULL DEFAULT 0,
    `certificateEnabled` BOOLEAN NOT NULL DEFAULT true,
    `completionThreshold` DOUBLE NOT NULL DEFAULT 80,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `instructorId` VARCHAR(191) NOT NULL,
    `reviewStatus` VARCHAR(191) NOT NULL DEFAULT 'draft',
    `reviewNote` VARCHAR(191) NULL,
    `reviewChecklist` MEDIUMTEXT NULL,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `staffPick` BOOLEAN NOT NULL DEFAULT false,
    `overridePrice` DECIMAL(10, 2) NULL,
    `overridePriceUntil` DATETIME(3) NULL,
    `ageRestriction` VARCHAR(191) NOT NULL DEFAULT 'none',
    `regionRestricted` BOOLEAN NOT NULL DEFAULT false,
    `flaggedReason` VARCHAR(191) NULL,
    `adminNotes` MEDIUMTEXT NULL,
    `submittedForReviewAt` DATETIME(3) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `reviewedBy` VARCHAR(191) NULL,
    `promoVideoUrl` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Module` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `courseId` VARCHAR(191) NOT NULL,
    `learningObjectives` MEDIUMTEXT NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Lesson` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `content` TEXT NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'video',
    `videoUrl` VARCHAR(191) NULL,
    `duration` INTEGER NOT NULL DEFAULT 0,
    `order` INTEGER NOT NULL DEFAULT 0,
    `moduleId` VARCHAR(191) NOT NULL,
    `resources` MEDIUMTEXT NULL,
    `objectives` MEDIUMTEXT NULL,
    `isFree` BOOLEAN NOT NULL DEFAULT false,
    `isPublished` BOOLEAN NOT NULL DEFAULT true,
    `transcript` VARCHAR(191) NULL,
    `slideUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Enrollment` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `progress` DOUBLE NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `enrolledAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `lastAccessed` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Enrollment_userId_courseId_key`(`userId`, `courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LessonProgress` (
    `id` VARCHAR(191) NOT NULL,
    `enrollmentId` VARCHAR(191) NOT NULL,
    `lessonId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'not_started',
    `timeSpent` INTEGER NOT NULL DEFAULT 0,
    `completedAt` DATETIME(3) NULL,
    `xpEarned` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `LessonProgress_enrollmentId_lessonId_key`(`enrollmentId`, `lessonId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Quiz` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'practice',
    `timeLimit` INTEGER NOT NULL DEFAULT 0,
    `passingScore` DOUBLE NOT NULL DEFAULT 70,
    `courseId` VARCHAR(191) NULL,
    `moduleId` VARCHAR(191) NULL,
    `maxAttempts` INTEGER NOT NULL DEFAULT 0,
    `isPublished` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Assignment` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `instructions` TEXT NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'written',
    `moduleId` VARCHAR(191) NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `maxScore` INTEGER NOT NULL DEFAULT 100,
    `dueDate` DATETIME(3) NULL,
    `rubric` MEDIUMTEXT NULL,
    `resources` MEDIUMTEXT NULL,
    `submissionType` VARCHAR(191) NOT NULL DEFAULT 'text',
    `wordLimit` INTEGER NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT true,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Question` (
    `id` VARCHAR(191) NOT NULL,
    `quizId` VARCHAR(191) NOT NULL,
    `text` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'mcq',
    `options` MEDIUMTEXT NOT NULL,
    `correctAnswer` VARCHAR(191) NOT NULL,
    `explanation` VARCHAR(191) NULL,
    `points` INTEGER NOT NULL DEFAULT 1,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuizAttempt` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `quizId` VARCHAR(191) NOT NULL,
    `score` DOUBLE NOT NULL DEFAULT 0,
    `maxScore` DOUBLE NOT NULL DEFAULT 0,
    `percentage` DOUBLE NOT NULL DEFAULT 0,
    `passed` BOOLEAN NOT NULL DEFAULT false,
    `answers` MEDIUMTEXT NOT NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `xpEarned` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Badge` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `icon` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `xpReward` INTEGER NOT NULL DEFAULT 0,
    `coinReward` INTEGER NOT NULL DEFAULT 0,
    `requirement` MEDIUMTEXT NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserBadge` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `badgeId` VARCHAR(191) NOT NULL,
    `earnedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `UserBadge_userId_badgeId_key`(`userId`, `badgeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Certificate` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `courseTitle` VARCHAR(191) NOT NULL,
    `userName` VARCHAR(191) NOT NULL,
    `instructorName` VARCHAR(191) NULL,
    `score` DOUBLE NOT NULL,
    `issuedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `certificateId` VARCHAR(191) NOT NULL,
    `verificationHash` VARCHAR(191) NULL,
    `templateType` VARCHAR(191) NOT NULL DEFAULT 'completion',

    UNIQUE INDEX `Certificate_certificateId_key`(`certificateId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TutorSession` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `context` VARCHAR(191) NULL,
    `language` VARCHAR(191) NOT NULL DEFAULT 'en',
    `isArchived` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatMessage` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NULL,
    `role` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `context` VARCHAR(191) NULL,
    `language` VARCHAR(191) NOT NULL DEFAULT 'en',
    `quickAction` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ParentLink` (
    `id` VARCHAR(191) NOT NULL,
    `parentId` VARCHAR(191) NOT NULL,
    `childId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `ParentLink_parentId_childId_key`(`parentId`, `childId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DailyActivity` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `date` VARCHAR(191) NOT NULL,
    `xpEarned` INTEGER NOT NULL DEFAULT 0,
    `lessonsCompleted` INTEGER NOT NULL DEFAULT 0,
    `quizzesTaken` INTEGER NOT NULL DEFAULT 0,
    `timeSpent` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `DailyActivity_userId_date_key`(`userId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlatformStats` (
    `id` VARCHAR(191) NOT NULL,
    `totalUsers` INTEGER NOT NULL DEFAULT 0,
    `totalCourses` INTEGER NOT NULL DEFAULT 0,
    `totalEnrollments` INTEGER NOT NULL DEFAULT 0,
    `totalCertificates` INTEGER NOT NULL DEFAULT 0,
    `activeUsers` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QAQuestion` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `lessonId` VARCHAR(191) NULL,
    `question` VARCHAR(191) NOT NULL,
    `isAnswered` BOOLEAN NOT NULL DEFAULT false,
    `isPinned` BOOLEAN NOT NULL DEFAULT false,
    `isFlagged` BOOLEAN NOT NULL DEFAULT false,
    `upvotes` INTEGER NOT NULL DEFAULT 0,
    `aiDraftAnswer` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `flaggedReason` VARCHAR(191) NULL,
    `flagCount` INTEGER NOT NULL DEFAULT 0,
    `aiAssessment` VARCHAR(191) NULL,
    `moderationStatus` VARCHAR(191) NOT NULL DEFAULT 'none',
    `moderatedAt` DATETIME(3) NULL,
    `moderatedBy` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QAAnswer` (
    `id` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `isAiGenerated` BOOLEAN NOT NULL DEFAULT false,
    `isInstructorAnswer` BOOLEAN NOT NULL DEFAULT false,
    `isEdited` BOOLEAN NOT NULL DEFAULT false,
    `isAccepted` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `isFlagged` BOOLEAN NOT NULL DEFAULT false,
    `flaggedReason` VARCHAR(191) NULL,
    `flagCount` INTEGER NOT NULL DEFAULT 0,
    `aiAssessment` VARCHAR(191) NULL,
    `moderationStatus` VARCHAR(191) NOT NULL DEFAULT 'none',
    `moderatedAt` DATETIME(3) NULL,
    `moderatedBy` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QAUpvote` (
    `id` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `QAUpvote_questionId_userId_key`(`questionId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QAAnswerUpvote` (
    `id` VARCHAR(191) NOT NULL,
    `answerId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `QAAnswerUpvote_answerId_userId_key`(`answerId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QASettings` (
    `id` VARCHAR(191) NOT NULL,
    `instructorId` VARCHAR(191) NOT NULL,
    `autoAnswer` BOOLEAN NOT NULL DEFAULT false,
    `emailNotifications` VARCHAR(191) NOT NULL DEFAULT 'immediately',
    `allowStudentReplies` BOOLEAN NOT NULL DEFAULT true,
    `requireApproval` BOOLEAN NOT NULL DEFAULT false,
    `maxQuestionsPerDay` INTEGER NOT NULL DEFAULT 10,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `QASettings_instructorId_key`(`instructorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Submission` (
    `id` VARCHAR(191) NOT NULL,
    `assignmentId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `fileUrls` MEDIUMTEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'submitted',
    `score` DOUBLE NULL,
    `feedback` VARCHAR(191) NULL,
    `rubricScores` MEDIUMTEXT NULL,
    `aiPreGrade` MEDIUMTEXT NULL,
    `aiFeedback` VARCHAR(191) NULL,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `gradedAt` DATETIME(3) NULL,
    `gradedBy` VARCHAR(191) NULL,
    `timeSpent` INTEGER NOT NULL DEFAULT 0,
    `attempt` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Transaction` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'PKR',
    `status` VARCHAR(191) NOT NULL DEFAULT 'completed',
    `description` TEXT NULL,
    `courseId` VARCHAR(191) NULL,
    `studentId` VARCHAR(191) NULL,
    `instructorId` VARCHAR(191) NULL,
    `payoutId` VARCHAR(191) NULL,
    `metadata` MEDIUMTEXT NULL,
    `paymentMethod` VARCHAR(191) NOT NULL DEFAULT 'credit_debit_card',
    `platformFee` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `instructorEarning` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `invoiceNumber` VARCHAR(191) NULL,
    `refundedAt` DATETIME(3) NULL,
    `refundReason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PayoutMethod` (
    `id` VARCHAR(191) NOT NULL,
    `instructorId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `bankName` VARCHAR(191) NULL,
    `accountNumber` VARCHAR(191) NULL,
    `accountHolder` VARCHAR(191) NULL,
    `branchCode` VARCHAR(191) NULL,
    `phoneNumber` VARCHAR(191) NULL,
    `accountName` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `countryCode` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payout` (
    `id` VARCHAR(191) NOT NULL,
    `instructorId` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'PKR',
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `method` VARCHAR(191) NOT NULL,
    `payoutMethodId` VARCHAR(191) NULL,
    `reference` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `periodStart` DATETIME(3) NULL,
    `periodEnd` DATETIME(3) NULL,
    `requestedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `disputeReason` VARCHAR(191) NULL,
    `disputeResolution` VARCHAR(191) NULL,
    `disputedAt` DATETIME(3) NULL,
    `taxWithheld` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `grossEarning` DECIMAL(10, 2) NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Conversation` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'direct',
    `courseId` VARCHAR(191) NULL,
    `title` VARCHAR(191) NULL,
    `lastMessageAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastMessageContent` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ConversationParticipant` (
    `id` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'member',
    `lastReadAt` DATETIME(3) NULL,
    `isMuted` BOOLEAN NOT NULL DEFAULT false,
    `isArchived` BOOLEAN NOT NULL DEFAULT false,
    `isStarred` BOOLEAN NOT NULL DEFAULT false,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ConversationParticipant_conversationId_userId_key`(`conversationId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Message` (
    `id` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'text',
    `attachments` MEDIUMTEXT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `readBy` MEDIUMTEXT NULL,
    `editedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `icon` VARCHAR(191) NULL,
    `link` VARCHAR(191) NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `readAt` DATETIME(3) NULL,
    `courseId` VARCHAR(191) NULL,
    `senderId` VARCHAR(191) NULL,
    `metadata` MEDIUMTEXT NULL,
    `priority` VARCHAR(191) NOT NULL DEFAULT 'normal',
    `category` VARCHAR(191) NOT NULL DEFAULT 'general',
    `actionUrl` VARCHAR(191) NULL,
    `actionLabel` VARCHAR(191) NULL,
    `dismissUrl` VARCHAR(191) NULL,
    `dismissLabel` VARCHAR(191) NULL,
    `isArchived` BOOLEAN NOT NULL DEFAULT false,
    `archivedAt` DATETIME(3) NULL,
    `isPinned` BOOLEAN NOT NULL DEFAULT false,
    `pinnedAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notification_userId_isRead_idx`(`userId`, `isRead`),
    INDEX `Notification_userId_isArchived_idx`(`userId`, `isArchived`),
    INDEX `Notification_userId_type_idx`(`userId`, `type`),
    INDEX `Notification_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NotificationPreference` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `enableInApp` BOOLEAN NOT NULL DEFAULT true,
    `enableEmail` BOOLEAN NOT NULL DEFAULT true,
    `enablePush` BOOLEAN NOT NULL DEFAULT false,
    `enrollmentNotifications` BOOLEAN NOT NULL DEFAULT true,
    `courseUpdateNotifications` BOOLEAN NOT NULL DEFAULT true,
    `assignmentNotifications` BOOLEAN NOT NULL DEFAULT true,
    `qaNotifications` BOOLEAN NOT NULL DEFAULT true,
    `reviewNotifications` BOOLEAN NOT NULL DEFAULT true,
    `messageNotifications` BOOLEAN NOT NULL DEFAULT true,
    `payoutNotifications` BOOLEAN NOT NULL DEFAULT true,
    `achievementNotifications` BOOLEAN NOT NULL DEFAULT true,
    `socialNotifications` BOOLEAN NOT NULL DEFAULT true,
    `securityNotifications` BOOLEAN NOT NULL DEFAULT true,
    `promotionNotifications` BOOLEAN NOT NULL DEFAULT false,
    `liveSessionNotifications` BOOLEAN NOT NULL DEFAULT true,
    `reminderNotifications` BOOLEAN NOT NULL DEFAULT true,
    `systemNotifications` BOOLEAN NOT NULL DEFAULT true,
    `digestMode` VARCHAR(191) NOT NULL DEFAULT 'instant',
    `quietHoursEnabled` BOOLEAN NOT NULL DEFAULT false,
    `quietHoursStart` VARCHAR(191) NOT NULL DEFAULT '22:00',
    `quietHoursEnd` VARCHAR(191) NOT NULL DEFAULT '08:00',
    `soundEnabled` BOOLEAN NOT NULL DEFAULT true,
    `desktopAlerts` BOOLEAN NOT NULL DEFAULT false,
    `autoArchiveReadAfterDays` INTEGER NOT NULL DEFAULT 30,
    `autoDeleteArchivedAfterDays` INTEGER NOT NULL DEFAULT 90,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `NotificationPreference_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InstructorProfile` (
    `id` VARCHAR(191) NOT NULL,
    `instructorId` VARCHAR(191) NOT NULL,
    `headline` VARCHAR(191) NULL,
    `website` VARCHAR(191) NULL,
    `linkedin` VARCHAR(191) NULL,
    `twitter` VARCHAR(191) NULL,
    `youtube` VARCHAR(191) NULL,
    `expertise` MEDIUMTEXT NULL,
    `languages` MEDIUMTEXT NULL,
    `ntn` VARCHAR(191) NULL,
    `ntnVerified` BOOLEAN NOT NULL DEFAULT false,
    `applicationStatus` VARCHAR(191) NULL DEFAULT 'pending',
    `appliedAt` DATETIME(3) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `reviewedBy` VARCHAR(191) NULL,
    `rejectionReason` VARCHAR(191) NULL,
    `sampleOutline` VARCHAR(191) NULL,
    `cnic` VARCHAR(191) NULL,
    `topicProposal` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `InstructorProfile_instructorId_key`(`instructorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InstructorSettings` (
    `id` VARCHAR(191) NOT NULL,
    `instructorId` VARCHAR(191) NOT NULL,
    `notifyEnrollment` VARCHAR(191) NOT NULL DEFAULT 'in-app',
    `notifyQA` VARCHAR(191) NOT NULL DEFAULT 'in-app',
    `notifyReview` VARCHAR(191) NOT NULL DEFAULT 'in-app',
    `notifyAssignment` VARCHAR(191) NOT NULL DEFAULT 'in-app',
    `notifyMessage` VARCHAR(191) NOT NULL DEFAULT 'in-app',
    `notifyCourseApproved` VARCHAR(191) NOT NULL DEFAULT 'in-app',
    `notifyPayout` VARCHAR(191) NOT NULL DEFAULT 'in-app',
    `notifyPromotion` VARCHAR(191) NOT NULL DEFAULT 'off',
    `payoutSchedule` VARCHAR(191) NOT NULL DEFAULT 'monthly',
    `payoutThreshold` INTEGER NOT NULL DEFAULT 2000,
    `defaultPayoutMethodId` VARCHAR(191) NULL,
    `integrations` MEDIUMTEXT NULL,
    `theme` VARCHAR(191) NOT NULL DEFAULT 'system',
    `compactMode` BOOLEAN NOT NULL DEFAULT false,
    `sidebarPosition` VARCHAR(191) NOT NULL DEFAULT 'left',
    `fontSize` VARCHAR(191) NOT NULL DEFAULT 'medium',
    `profileVisibility` VARCHAR(191) NOT NULL DEFAULT 'public',
    `showEmail` BOOLEAN NOT NULL DEFAULT false,
    `showPhone` BOOLEAN NOT NULL DEFAULT false,
    `showRevenue` BOOLEAN NOT NULL DEFAULT false,
    `showStudentCount` BOOLEAN NOT NULL DEFAULT true,
    `timezone` VARCHAR(191) NOT NULL DEFAULT 'Asia/Karachi',
    `dateFormat` VARCHAR(191) NOT NULL DEFAULT 'DD/MM/YYYY',
    `currency` VARCHAR(191) NOT NULL DEFAULT 'PKR',
    `preferredLanguage` VARCHAR(191) NOT NULL DEFAULT 'en',
    `emailDigest` VARCHAR(191) NOT NULL DEFAULT 'daily',
    `marketingEmails` BOOLEAN NOT NULL DEFAULT true,
    `securityAlertEmails` BOOLEAN NOT NULL DEFAULT true,
    `courseUpdateEmails` BOOLEAN NOT NULL DEFAULT true,
    `autoSaveDrafts` BOOLEAN NOT NULL DEFAULT true,
    `defaultCourseLanguage` VARCHAR(191) NOT NULL DEFAULT 'en',
    `videoQuality` VARCHAR(191) NOT NULL DEFAULT '1080p',
    `deactivatedAt` DATETIME(3) NULL,
    `deletionRequestedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `InstructorSettings_instructorId_key`(`instructorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserSession` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `deviceName` VARCHAR(191) NULL,
    `deviceType` VARCHAR(191) NOT NULL DEFAULT 'desktop',
    `browser` VARCHAR(191) NULL,
    `os` VARCHAR(191) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `location` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastActivity` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `UserSession_token_key`(`token`),
    INDEX `UserSession_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LiveSession` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `courseId` VARCHAR(191) NULL,
    `instructorId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'live_class',
    `meetingUrl` VARCHAR(191) NULL,
    `meetingId` VARCHAR(191) NULL,
    `meetingPassword` VARCHAR(191) NULL,
    `scheduledAt` DATETIME(3) NOT NULL,
    `duration` INTEGER NOT NULL DEFAULT 60,
    `status` VARCHAR(191) NOT NULL DEFAULT 'scheduled',
    `maxAttendees` INTEGER NULL,
    `recordingUrl` VARCHAR(191) NULL,
    `isRecurring` BOOLEAN NOT NULL DEFAULT false,
    `recurrencePattern` MEDIUMTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SessionAttendee` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'registered',
    `joinedAt` DATETIME(3) NULL,
    `leftAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `SessionAttendee_sessionId_userId_key`(`sessionId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Wishlist` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Wishlist_userId_courseId_key`(`userId`, `courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Review` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `enrollmentId` VARCHAR(191) NOT NULL,
    `rating` INTEGER NOT NULL,
    `content` TEXT NULL,
    `isAnonymous` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `isFlagged` BOOLEAN NOT NULL DEFAULT false,
    `flaggedReason` VARCHAR(191) NULL,
    `flagCount` INTEGER NOT NULL DEFAULT 0,
    `aiAssessment` VARCHAR(191) NULL,
    `moderationStatus` VARCHAR(191) NOT NULL DEFAULT 'none',
    `moderatedAt` DATETIME(3) NULL,
    `moderatedBy` VARCHAR(191) NULL,
    `flaggedBy` VARCHAR(191) NULL,

    UNIQUE INDEX `Review_enrollmentId_key`(`enrollmentId`),
    UNIQUE INDEX `Review_userId_courseId_key`(`userId`, `courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LessonNote` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `lessonId` VARCHAR(191) NOT NULL,
    `enrollmentId` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `timestamp` INTEGER NOT NULL DEFAULT 0,
    `color` VARCHAR(191) NOT NULL DEFAULT 'default',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LessonNote_userId_lessonId_enrollmentId_idx`(`userId`, `lessonId`, `enrollmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LessonBookmark` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `lessonId` VARCHAR(191) NOT NULL,
    `enrollmentId` VARCHAR(191) NOT NULL,
    `timestamp` INTEGER NOT NULL DEFAULT 0,
    `label` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LessonBookmark_userId_lessonId_enrollmentId_idx`(`userId`, `lessonId`, `enrollmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Skill` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `icon` VARCHAR(191) NULL,
    `parentSkillId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Skill_name_key`(`name`),
    UNIQUE INDEX `Skill_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserSkill` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `skillId` VARCHAR(191) NOT NULL,
    `lessonScore` DOUBLE NOT NULL DEFAULT 0,
    `quizScore` DOUBLE NOT NULL DEFAULT 0,
    `assignmentScore` DOUBLE NOT NULL DEFAULT 0,
    `tutorSignalScore` DOUBLE NOT NULL DEFAULT 0,
    `certBonus` DOUBLE NOT NULL DEFAULT 0,
    `overallScore` DOUBLE NOT NULL DEFAULT 0,
    `level` VARCHAR(191) NOT NULL DEFAULT 'awareness',
    `lastUpdated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastPracticed` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `evidenceCount` INTEGER NOT NULL DEFAULT 0,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `verifiedBy` VARCHAR(191) NULL,
    `verifiedAt` DATETIME(3) NULL,
    `xpEarned` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `UserSkill_userId_idx`(`userId`),
    INDEX `UserSkill_userId_skillId_idx`(`userId`, `skillId`),
    INDEX `UserSkill_level_idx`(`level`),
    UNIQUE INDEX `UserSkill_userId_skillId_key`(`userId`, `skillId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DiscussionPost` (
    `id` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `isPinned` BOOLEAN NOT NULL DEFAULT false,
    `isLocked` BOOLEAN NOT NULL DEFAULT false,
    `upvotes` INTEGER NOT NULL DEFAULT 0,
    `replyCount` INTEGER NOT NULL DEFAULT 0,
    `lessonId` VARCHAR(191) NULL,
    `lessonContext` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `isFlagged` BOOLEAN NOT NULL DEFAULT false,
    `flaggedReason` VARCHAR(191) NULL,
    `flagCount` INTEGER NOT NULL DEFAULT 0,
    `aiAssessment` VARCHAR(191) NULL,
    `moderationStatus` VARCHAR(191) NOT NULL DEFAULT 'none',
    `moderatedAt` DATETIME(3) NULL,
    `moderatedBy` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DiscussionReply` (
    `id` VARCHAR(191) NOT NULL,
    `postId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `upvotes` INTEGER NOT NULL DEFAULT 0,
    `isEdited` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `isFlagged` BOOLEAN NOT NULL DEFAULT false,
    `flaggedReason` VARCHAR(191) NULL,
    `flagCount` INTEGER NOT NULL DEFAULT 0,
    `aiAssessment` VARCHAR(191) NULL,
    `moderationStatus` VARCHAR(191) NOT NULL DEFAULT 'none',
    `moderatedAt` DATETIME(3) NULL,
    `moderatedBy` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DiscussionUpvote` (
    `id` VARCHAR(191) NOT NULL,
    `postId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `DiscussionUpvote_postId_userId_key`(`postId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudyGroup` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `emoji` VARCHAR(191) NOT NULL DEFAULT '≡ƒôÜ',
    `courseId` VARCHAR(191) NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `maxMembers` INTEGER NOT NULL DEFAULT 50,
    `memberCount` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudyGroupMember` (
    `id` VARCHAR(191) NOT NULL,
    `groupId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'member',
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `StudyGroupMember_groupId_userId_key`(`groupId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PeerReview` (
    `id` VARCHAR(191) NOT NULL,
    `assignmentId` VARCHAR(191) NOT NULL,
    `submissionId` VARCHAR(191) NOT NULL,
    `reviewerId` VARCHAR(191) NOT NULL,
    `revieweeId` VARCHAR(191) NOT NULL,
    `feedback` VARCHAR(191) NULL,
    `rating` INTEGER NULL,
    `xpAwarded` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContentModerationSettings` (
    `id` VARCHAR(191) NOT NULL,
    `autoRemoveProfanity` BOOLEAN NOT NULL DEFAULT true,
    `autoFlagExternalLinks` BOOLEAN NOT NULL DEFAULT true,
    `aiContentScreening` BOOLEAN NOT NULL DEFAULT true,
    `requireEmailVerification` BOOLEAN NOT NULL DEFAULT true,
    `minimumAccountAgeDays` INTEGER NOT NULL DEFAULT 1,
    `blocklistWordCount` INTEGER NOT NULL DEFAULT 0,
    `blocklistWords` MEDIUMTEXT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Dispute` (
    `id` VARCHAR(191) NOT NULL,
    `transactionId` VARCHAR(191) NOT NULL,
    `reportedBy` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'open',
    `description` VARCHAR(191) NOT NULL,
    `evidence` MEDIUMTEXT NULL,
    `resolutionNote` VARCHAR(191) NULL,
    `refundAmount` DECIMAL(10, 2) NULL,
    `resolvedAt` DATETIME(3) NULL,
    `resolvedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FinancialSettings` (
    `id` VARCHAR(191) NOT NULL,
    `platformCommissionRate` DOUBLE NOT NULL DEFAULT 20,
    `instructorPayoutRate` DOUBLE NOT NULL DEFAULT 80,
    `minimumPayoutAmount` INTEGER NOT NULL DEFAULT 2000,
    `refundPolicyDays` INTEGER NOT NULL DEFAULT 30,
    `withholdingTaxRate` DOUBLE NOT NULL DEFAULT 10,
    `autoApproveRefunds` BOOLEAN NOT NULL DEFAULT false,
    `disputeResolutionDays` INTEGER NOT NULL DEFAULT 14,
    `fiscalYearStart` VARCHAR(191) NOT NULL DEFAULT 'July',
    `currency` VARCHAR(191) NOT NULL DEFAULT 'PKR',
    `taxId` VARCHAR(191) NULL,
    `payoutHoldPeriodDays` INTEGER NOT NULL DEFAULT 14,
    `defaultPayoutSchedule` VARCHAR(191) NOT NULL DEFAULT 'monthly',
    `supportedPayoutMethods` VARCHAR(191) NOT NULL DEFAULT 'bank_transfer,jazzcash,easypaisa,payoneer,stripe',
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CommissionOverride` (
    `id` VARCHAR(191) NOT NULL,
    `instructorId` VARCHAR(191) NOT NULL,
    `commissionRate` DECIMAL(10, 2) NOT NULL,
    `reason` VARCHAR(191) NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CommissionOverride_instructorId_key`(`instructorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NotificationTemplate` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'both',
    `category` VARCHAR(191) NOT NULL DEFAULT 'system',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `variables` MEDIUMTEXT NULL,
    `icon` VARCHAR(191) NULL,
    `link` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `NotificationTemplate_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NotificationLog` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `targetAudience` VARCHAR(191) NOT NULL,
    `targetDetails` MEDIUMTEXT NULL,
    `priority` VARCHAR(191) NOT NULL DEFAULT 'normal',
    `link` VARCHAR(191) NULL,
    `sentCount` INTEGER NOT NULL DEFAULT 0,
    `openedCount` INTEGER NOT NULL DEFAULT 0,
    `clickCount` INTEGER NOT NULL DEFAULT 0,
    `scheduledAt` DATETIME(3) NULL,
    `sentAt` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'sent',
    `templateId` VARCHAR(191) NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NotificationSettings` (
    `id` VARCHAR(191) NOT NULL,
    `enableInApp` BOOLEAN NOT NULL DEFAULT true,
    `enableEmail` BOOLEAN NOT NULL DEFAULT true,
    `enablePush` BOOLEAN NOT NULL DEFAULT false,
    `enableSms` BOOLEAN NOT NULL DEFAULT false,
    `maxNotificationsPerDay` INTEGER NOT NULL DEFAULT 5,
    `maxBulkNotificationsPerDay` INTEGER NOT NULL DEFAULT 2,
    `quietHoursStart` VARCHAR(191) NOT NULL DEFAULT '22:00',
    `quietHoursEnd` VARCHAR(191) NOT NULL DEFAULT '08:00',
    `availableSegments` VARCHAR(191) NOT NULL DEFAULT 'inactive_30d,inactive_7d,new_users_7d,top_spenders,free_users,paid_users',
    `senderName` VARCHAR(191) NOT NULL DEFAULT 'ShijlAI Academy',
    `senderEmail` VARCHAR(191) NOT NULL DEFAULT 'notifications@shijlai.com',
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `XPRule` (
    `id` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `xpAwarded` INTEGER NOT NULL DEFAULT 0,
    `coinAwarded` INTEGER NOT NULL DEFAULT 0,
    `category` VARCHAR(191) NOT NULL DEFAULT 'learning',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `order` INTEGER NOT NULL DEFAULT 0,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `XPRule_action_key`(`action`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LevelConfig` (
    `id` VARCHAR(191) NOT NULL,
    `level` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `minXp` INTEGER NOT NULL DEFAULT 0,
    `maxXp` INTEGER NOT NULL,
    `badgeIcon` VARCHAR(191) NULL,
    `coinReward` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `LevelConfig_level_key`(`level`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GamificationSettings` (
    `id` VARCHAR(191) NOT NULL,
    `leaderboardResetFrequency` VARCHAR(191) NOT NULL DEFAULT 'monthly',
    `leaderboardShowFullName` BOOLEAN NOT NULL DEFAULT true,
    `topWinnerCount` INTEGER NOT NULL DEFAULT 3,
    `topWinnerRewardType` VARCHAR(191) NOT NULL DEFAULT 'platform_credit',
    `topWinnerRewardAmount` INTEGER NOT NULL DEFAULT 500,
    `streakXpMultiplier` DOUBLE NOT NULL DEFAULT 1.0,
    `streakFreezeEnabled` BOOLEAN NOT NULL DEFAULT true,
    `streakFreezeCost` INTEGER NOT NULL DEFAULT 50,
    `maxStreakFreezesPerMonth` INTEGER NOT NULL DEFAULT 3,
    `xpEnabled` BOOLEAN NOT NULL DEFAULT true,
    `badgesEnabled` BOOLEAN NOT NULL DEFAULT true,
    `leaderboardsEnabled` BOOLEAN NOT NULL DEFAULT true,
    `streaksEnabled` BOOLEAN NOT NULL DEFAULT true,
    `rewardsEnabled` BOOLEAN NOT NULL DEFAULT true,
    `challengesEnabled` BOOLEAN NOT NULL DEFAULT true,
    `eventsEnabled` BOOLEAN NOT NULL DEFAULT true,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StreakReward` (
    `id` VARCHAR(191) NOT NULL,
    `streakDays` INTEGER NOT NULL,
    `xpBonus` INTEGER NOT NULL DEFAULT 0,
    `coinBonus` INTEGER NOT NULL DEFAULT 0,
    `badgeId` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `StreakReward_streakDays_key`(`streakDays`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RewardShopItem` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `icon` VARCHAR(191) NOT NULL DEFAULT '≡ƒÄü',
    `category` VARCHAR(191) NOT NULL DEFAULT 'digital',
    `coinCost` INTEGER NOT NULL,
    `xpCost` INTEGER NOT NULL DEFAULT 0,
    `stock` INTEGER NOT NULL DEFAULT -1,
    `claimed` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserReward` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `itemId` VARCHAR(191) NOT NULL,
    `coinPaid` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `redeemedAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GamificationEvent` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `icon` VARCHAR(191) NOT NULL DEFAULT '≡ƒÄë',
    `xpMultiplier` DOUBLE NOT NULL DEFAULT 1.0,
    `coinMultiplier` DOUBLE NOT NULL DEFAULT 1.0,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AIConfiguration` (
    `id` VARCHAR(191) NOT NULL,
    `tutorEnabled` BOOLEAN NOT NULL DEFAULT true,
    `tutorMode` VARCHAR(191) NOT NULL DEFAULT 'socratic',
    `tutorLanguages` VARCHAR(191) NOT NULL DEFAULT 'en,ur',
    `tutorContextWindow` INTEGER NOT NULL DEFAULT 20,
    `tutorMaxTokens` INTEGER NOT NULL DEFAULT 800,
    `tutorSafetyLevel` VARCHAR(191) NOT NULL DEFAULT 'strict',
    `tutorBlockedTopics` VARCHAR(2000) NOT NULL DEFAULT '[]',
    `tutorSystemPrompt` VARCHAR(2000) NOT NULL DEFAULT 'You are ShijlAI Tutor, a helpful and patient AI learning assistant for students in Pakistan. Guide students using the Socratic method ΓÇö ask probing questions, give hints, and help them discover answers themselves. Be encouraging and supportive. Use examples relevant to Pakistani curriculum (FSc, O-Levels, A-Levels). Respond in the same language the student uses.',
    `quizGeneratorEnabled` BOOLEAN NOT NULL DEFAULT true,
    `curriculumGeneratorEnabled` BOOLEAN NOT NULL DEFAULT true,
    `thumbnailGeneratorEnabled` BOOLEAN NOT NULL DEFAULT true,
    `captionGeneratorEnabled` BOOLEAN NOT NULL DEFAULT true,
    `descriptionWriterEnabled` BOOLEAN NOT NULL DEFAULT true,
    `rubricGeneratorEnabled` BOOLEAN NOT NULL DEFAULT true,
    `gradingAssistEnabled` BOOLEAN NOT NULL DEFAULT true,
    `seoOptimizerEnabled` BOOLEAN NOT NULL DEFAULT true,
    `autoScreenQA` BOOLEAN NOT NULL DEFAULT true,
    `autoScreenReviews` BOOLEAN NOT NULL DEFAULT true,
    `autoScreenCourseContent` BOOLEAN NOT NULL DEFAULT true,
    `flagConfidenceThreshold` INTEGER NOT NULL DEFAULT 75,
    `removeConfidenceThreshold` INTEGER NOT NULL DEFAULT 95,
    `recommendationAlgorithm` VARCHAR(191) NOT NULL DEFAULT 'hybrid',
    `recommendationRefreshHours` INTEGER NOT NULL DEFAULT 24,
    `boostNewCourses` BOOLEAN NOT NULL DEFAULT true,
    `boostNewCourseDays` INTEGER NOT NULL DEFAULT 30,
    `boostFeaturedCourses` BOOLEAN NOT NULL DEFAULT true,
    `coldStartStrategy` VARCHAR(191) NOT NULL DEFAULT 'onboarding_quiz',
    `monthlySpendCap` DECIMAL(10, 2) NOT NULL DEFAULT 300,
    `spendCapEnabled` BOOLEAN NOT NULL DEFAULT false,
    `defaultProviderId` VARCHAR(191) NULL,
    `defaultModelId` VARCHAR(191) NULL,
    `fallbackProviderId` VARCHAR(191) NULL,
    `fallbackModelId` VARCHAR(191) NULL,
    `rateLimitEnabled` BOOLEAN NOT NULL DEFAULT true,
    `rateLimitRpm` INTEGER NOT NULL DEFAULT 60,
    `rateLimitTpm` INTEGER NOT NULL DEFAULT 100000,
    `retryOnFailure` BOOLEAN NOT NULL DEFAULT true,
    `maxRetries` INTEGER NOT NULL DEFAULT 3,
    `retryDelayMs` INTEGER NOT NULL DEFAULT 1000,
    `fallbackOnFailure` BOOLEAN NOT NULL DEFAULT true,
    `logRequests` BOOLEAN NOT NULL DEFAULT true,
    `logResponses` BOOLEAN NOT NULL DEFAULT false,
    `logRetentionDays` INTEGER NOT NULL DEFAULT 90,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AIProvider` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'llm',
    `apiKey` VARCHAR(191) NULL,
    `apiEndpoint` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `priority` INTEGER NOT NULL DEFAULT 0,
    `config` VARCHAR(4000) NOT NULL DEFAULT '{}',
    `monthlyBudget` DECIMAL(10, 2) NULL,
    `healthStatus` VARCHAR(191) NOT NULL DEFAULT 'unknown',
    `lastHealthCheck` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AIProvider_name_key`(`name`),
    UNIQUE INDEX `AIProvider_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AIModel` (
    `id` VARCHAR(191) NOT NULL,
    `providerId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `modelId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'chat',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `inputPricePer1M` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `outputPricePer1M` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `contextWindow` INTEGER NOT NULL DEFAULT 4096,
    `maxOutputTokens` INTEGER NOT NULL DEFAULT 4096,
    `supportsVision` BOOLEAN NOT NULL DEFAULT false,
    `supportsStreaming` BOOLEAN NOT NULL DEFAULT true,
    `supportsJson` BOOLEAN NOT NULL DEFAULT true,
    `capabilities` VARCHAR(4000) NOT NULL DEFAULT '{}',
    `rpmLimit` INTEGER NULL,
    `tpmLimit` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AIModel_providerId_slug_key`(`providerId`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AIUsageLog` (
    `id` VARCHAR(191) NOT NULL,
    `providerId` VARCHAR(191) NOT NULL,
    `modelId` VARCHAR(191) NULL,
    `feature` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `promptTokens` INTEGER NOT NULL DEFAULT 0,
    `completionTokens` INTEGER NOT NULL DEFAULT 0,
    `totalTokens` INTEGER NOT NULL DEFAULT 0,
    `costUSD` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `latencyMs` INTEGER NULL,
    `isStreamed` BOOLEAN NOT NULL DEFAULT false,
    `status` VARCHAR(191) NOT NULL DEFAULT 'success',
    `errorMessage` VARCHAR(191) NULL,
    `errorCode` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `courseId` VARCHAR(191) NULL,
    `sessionId` VARCHAR(191) NULL,
    `requestId` VARCHAR(191) NULL,
    `metadata` VARCHAR(4000) NOT NULL DEFAULT '{}',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AIPromptTemplate` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'general',
    `description` VARCHAR(191) NULL,
    `content` VARCHAR(191) NOT NULL,
    `variables` VARCHAR(1000) NOT NULL DEFAULT '[]',
    `version` INTEGER NOT NULL DEFAULT 1,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `parentVersionId` VARCHAR(191) NULL,
    `tags` VARCHAR(1000) NOT NULL DEFAULT '[]',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AIPromptTemplate_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AIAuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `previousValue` MEDIUMTEXT NULL,
    `newValue` MEDIUMTEXT NULL,
    `performedBy` VARCHAR(191) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `severity` VARCHAR(191) NOT NULL DEFAULT 'info',
    `metadata` VARCHAR(4000) NOT NULL DEFAULT '{}',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AppearanceBranding` (
    `id` VARCHAR(191) NOT NULL,
    `platformName` VARCHAR(191) NOT NULL DEFAULT 'ShijlAI Academy',
    `tagline` VARCHAR(191) NOT NULL DEFAULT 'Learn smarter. Powered by AI.',
    `logoLightUrl` VARCHAR(191) NULL,
    `logoDarkUrl` VARCHAR(191) NULL,
    `faviconUrl` VARCHAR(191) NULL,
    `appleTouchIconUrl` VARCHAR(191) NULL,
    `ogImageUrl` VARCHAR(191) NULL,
    `primaryColor` VARCHAR(191) NOT NULL DEFAULT '#7F77DD',
    `secondaryColor` VARCHAR(191) NOT NULL DEFAULT '#1D9E75',
    `accentColor` VARCHAR(191) NOT NULL DEFAULT '#F59E0B',
    `successColor` VARCHAR(191) NOT NULL DEFAULT '#10B981',
    `warningColor` VARCHAR(191) NOT NULL DEFAULT '#F59E0B',
    `errorColor` VARCHAR(191) NOT NULL DEFAULT '#EF4444',
    `fontFamily` VARCHAR(191) NOT NULL DEFAULT 'Inter',
    `headingFontFamily` VARCHAR(191) NOT NULL DEFAULT 'Inter',
    `baseFontSize` VARCHAR(191) NOT NULL DEFAULT '16',
    `lineHeight` VARCHAR(191) NOT NULL DEFAULT '1.6',
    `themePreset` VARCHAR(191) NOT NULL DEFAULT 'custom',
    `darkPrimaryColor` VARCHAR(191) NOT NULL DEFAULT '#8B83F0',
    `darkSecondaryColor` VARCHAR(191) NOT NULL DEFAULT '#34D399',
    `darkAccentColor` VARCHAR(191) NOT NULL DEFAULT '#FBBF24',
    `darkBgColor` VARCHAR(191) NOT NULL DEFAULT '#0F172A',
    `darkCardColor` VARCHAR(191) NOT NULL DEFAULT '#1E293B',
    `lightBgColor` VARCHAR(191) NOT NULL DEFAULT '#FFFFFF',
    `lightCardColor` VARCHAR(191) NOT NULL DEFAULT '#F8FAFC',
    `navStyle` VARCHAR(191) NOT NULL DEFAULT 'sticky',
    `navShowSearch` BOOLEAN NOT NULL DEFAULT true,
    `navShowNotifications` BOOLEAN NOT NULL DEFAULT true,
    `navTransparentOnLanding` BOOLEAN NOT NULL DEFAULT false,
    `footerVisible` BOOLEAN NOT NULL DEFAULT true,
    `footerContent` MEDIUMTEXT NULL,
    `footerSocialLinks` MEDIUMTEXT NULL,
    `footerCopyrightText` VARCHAR(191) NOT NULL DEFAULT '┬⌐ 2024 ShijlAI Academy. All rights reserved.',
    `ogTitle` VARCHAR(191) NULL,
    `ogDescription` VARCHAR(191) NULL,
    `twitterHandle` VARCHAR(191) NULL,
    `heroVisible` BOOLEAN NOT NULL DEFAULT true,
    `heroContent` VARCHAR(191) NULL,
    `featuredCoursesVisible` BOOLEAN NOT NULL DEFAULT true,
    `featuredCourseIds` VARCHAR(191) NULL,
    `trendingVisible` BOOLEAN NOT NULL DEFAULT true,
    `instructorSpotlightVisible` BOOLEAN NOT NULL DEFAULT true,
    `spotlightInstructorIds` VARCHAR(191) NULL,
    `testimonialsVisible` BOOLEAN NOT NULL DEFAULT true,
    `testimonialsContent` VARCHAR(191) NULL,
    `statsCounterVisible` BOOLEAN NOT NULL DEFAULT true,
    `statsMode` VARCHAR(191) NOT NULL DEFAULT 'auto',
    `statsManualContent` VARCHAR(191) NULL,
    `blogPreviewVisible` BOOLEAN NOT NULL DEFAULT false,
    `homepageSectionOrder` VARCHAR(191) NOT NULL DEFAULT 'hero,featured,trending,instructor_spotlight,testimonials,stats,blog',
    `certTemplate` VARCHAR(191) NOT NULL DEFAULT 'classic',
    `certLogoPosition` VARCHAR(191) NOT NULL DEFAULT 'top_center',
    `certSignatureUrl` VARCHAR(191) NULL,
    `certSignatoryName` VARCHAR(191) NOT NULL DEFAULT 'Ahmad Hassan ΓÇö CEO, ShijlAI Academy',
    `certBackgroundUrl` VARCHAR(191) NULL,
    `certBgColor` VARCHAR(191) NOT NULL DEFAULT '#FFFFFF',
    `emailHeaderBgColor` VARCHAR(191) NOT NULL DEFAULT '#7F77DD',
    `emailFooterText` VARCHAR(191) NOT NULL DEFAULT '┬⌐ 2024 ShijlAI Academy. All rights reserved.',
    `emailFontFamily` VARCHAR(191) NOT NULL DEFAULT 'Inter',
    `emailButtonRadius` VARCHAR(191) NOT NULL DEFAULT '8',
    `defaultTheme` VARCHAR(191) NOT NULL DEFAULT 'system',
    `borderRadius` VARCHAR(191) NOT NULL DEFAULT '12',
    `enableCustomCss` BOOLEAN NOT NULL DEFAULT false,
    `customCss` VARCHAR(191) NULL,
    `enableCustomJs` BOOLEAN NOT NULL DEFAULT false,
    `customJs` TEXT NULL,
    `enableAnimations` BOOLEAN NOT NULL DEFAULT true,
    `compactMode` BOOLEAN NOT NULL DEFAULT false,
    `enableWatermark` BOOLEAN NOT NULL DEFAULT false,
    `watermarkText` VARCHAR(191) NULL,
    `watermarkOpacity` VARCHAR(191) NOT NULL DEFAULT '0.05',
    `watermarkPosition` VARCHAR(191) NOT NULL DEFAULT 'bottom_right',
    `bannerEnabled` BOOLEAN NOT NULL DEFAULT false,
    `bannerMessage` VARCHAR(191) NULL,
    `bannerType` VARCHAR(191) NOT NULL DEFAULT 'info',
    `bannerDismissible` BOOLEAN NOT NULL DEFAULT true,
    `bannerLinkUrl` VARCHAR(191) NULL,
    `bannerLinkText` VARCHAR(191) NULL,
    `bannerBgColor` VARCHAR(191) NOT NULL DEFAULT '#7F77DD',
    `bannerTextColor` VARCHAR(191) NOT NULL DEFAULT '#FFFFFF',
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SecuritySettings` (
    `id` VARCHAR(191) NOT NULL,
    `userPasswordMinLength` INTEGER NOT NULL DEFAULT 8,
    `userPasswordUppercase` BOOLEAN NOT NULL DEFAULT true,
    `userPasswordLowercase` BOOLEAN NOT NULL DEFAULT false,
    `userPasswordNumber` BOOLEAN NOT NULL DEFAULT true,
    `userPasswordSpecial` BOOLEAN NOT NULL DEFAULT false,
    `adminPasswordMinLength` INTEGER NOT NULL DEFAULT 12,
    `adminPasswordUppercase` BOOLEAN NOT NULL DEFAULT true,
    `adminPasswordNumber` BOOLEAN NOT NULL DEFAULT true,
    `adminPasswordSpecial` BOOLEAN NOT NULL DEFAULT true,
    `passwordExpiryDays` INTEGER NOT NULL DEFAULT 90,
    `passwordPreventReuseCount` INTEGER NOT NULL DEFAULT 5,
    `enableMFA` BOOLEAN NOT NULL DEFAULT false,
    `force2FAForAdmins` BOOLEAN NOT NULL DEFAULT false,
    `enforceMFAForInstructors` BOOLEAN NOT NULL DEFAULT false,
    `mfaMethod` VARCHAR(191) NOT NULL DEFAULT 'totp',
    `rateLimitingEnabled` BOOLEAN NOT NULL DEFAULT true,
    `maxRequestsPerMinute` INTEGER NOT NULL DEFAULT 60,
    `loginAttemptThreshold` INTEGER NOT NULL DEFAULT 5,
    `lockDurationMinutes` INTEGER NOT NULL DEFAULT 15,
    `ipBasedRateLimiting` BOOLEAN NOT NULL DEFAULT true,
    `apiRateLimitPerHour` INTEGER NOT NULL DEFAULT 1000,
    `maxFailedLogins` INTEGER NOT NULL DEFAULT 5,
    `sessionTimeoutMinutes` INTEGER NOT NULL DEFAULT 60,
    `maxConcurrentSessions` INTEGER NOT NULL DEFAULT 3,
    `rememberMeDuration` INTEGER NOT NULL DEFAULT 30,
    `enforceSingleSession` BOOLEAN NOT NULL DEFAULT false,
    `idleTimeoutMinutes` INTEGER NOT NULL DEFAULT 30,
    `ipWhitelistEnabled` BOOLEAN NOT NULL DEFAULT false,
    `ipWhitelist` MEDIUMTEXT NULL,
    `loginAlertsEnabled` BOOLEAN NOT NULL DEFAULT true,
    `alertEmail` VARCHAR(191) NULL,
    `alertOnSuspiciousIp` BOOLEAN NOT NULL DEFAULT true,
    `alertOnNewDevice` BOOLEAN NOT NULL DEFAULT true,
    `alertOnFailedLogin` BOOLEAN NOT NULL DEFAULT true,
    `failedLoginThreshold` INTEGER NOT NULL DEFAULT 500,
    `corsEnabled` BOOLEAN NOT NULL DEFAULT false,
    `corsAllowedOrigins` MEDIUMTEXT NULL,
    `lastSecurityScanAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SecurityRole` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `permissions` MEDIUMTEXT NOT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SecurityRole_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ApiKey` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `keyPrefix` VARCHAR(191) NOT NULL,
    `keyHash` VARCHAR(191) NOT NULL,
    `keyLastFour` VARCHAR(191) NOT NULL,
    `permission` VARCHAR(191) NOT NULL DEFAULT 'full_access',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastUsedAt` DATETIME(3) NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `revokedAt` DATETIME(3) NULL,

    UNIQUE INDEX `ApiKey_keyHash_key`(`keyHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BlockedIp` (
    `id` VARCHAR(191) NOT NULL,
    `ip` VARCHAR(191) NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `blockedBy` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoginAlert` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `userName` VARCHAR(191) NULL,
    `userEmail` VARCHAR(191) NULL,
    `userRole` VARCHAR(191) NULL,
    `ip` VARCHAR(191) NOT NULL,
    `userAgent` VARCHAR(191) NULL,
    `location` VARCHAR(191) NULL,
    `eventType` VARCHAR(191) NOT NULL DEFAULT 'failed_login',
    `isSuspicious` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SecurityEvent` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `actorId` VARCHAR(191) NULL,
    `details` MEDIUMTEXT NULL,
    `ip` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlatformSettings` (
    `id` VARCHAR(191) NOT NULL,
    `platformName` VARCHAR(191) NOT NULL DEFAULT 'ShijlAI Academy',
    `platformUrl` VARCHAR(191) NOT NULL DEFAULT 'https://shijlai.academy',
    `supportEmail` VARCHAR(191) NOT NULL DEFAULT 'support@shijlai.academy',
    `defaultTimezone` VARCHAR(191) NOT NULL DEFAULT 'Asia/Karachi',
    `defaultCurrency` VARCHAR(191) NOT NULL DEFAULT 'PKR',
    `showUsdAlso` BOOLEAN NOT NULL DEFAULT true,
    `platformStatus` VARCHAR(191) NOT NULL DEFAULT 'online',
    `openRegistration` BOOLEAN NOT NULL DEFAULT true,
    `emailVerificationRequired` BOOLEAN NOT NULL DEFAULT true,
    `socialLoginGoogle` BOOLEAN NOT NULL DEFAULT true,
    `socialLoginFacebook` BOOLEAN NOT NULL DEFAULT true,
    `socialLoginApple` BOOLEAN NOT NULL DEFAULT true,
    `instructorSelfRegister` BOOLEAN NOT NULL DEFAULT false,
    `captchaOnSignup` BOOLEAN NOT NULL DEFAULT true,
    `minimumStudentAge` INTEGER NOT NULL DEFAULT 13,
    `adminReviewBeforePublish` BOOLEAN NOT NULL DEFAULT true,
    `maxReviewTimeHours` INTEGER NOT NULL DEFAULT 48,
    `minimumLessonsPerCourse` INTEGER NOT NULL DEFAULT 5,
    `minimumVideoDurationMinutes` INTEGER NOT NULL DEFAULT 3,
    `promoVideoRequired` BOOLEAN NOT NULL DEFAULT false,
    `quizPerSectionRequired` BOOLEAN NOT NULL DEFAULT true,
    `maxVideoFileSizeGb` INTEGER NOT NULL DEFAULT 4,
    `maxDocFileSizeMb` INTEGER NOT NULL DEFAULT 50,
    `supportedLanguages` VARCHAR(191) NOT NULL DEFAULT 'en,ur',
    `defaultLanguage` VARCHAR(191) NOT NULL DEFAULT 'en',
    `autoDetectLanguage` BOOLEAN NOT NULL DEFAULT true,
    `maintenanceMode` BOOLEAN NOT NULL DEFAULT false,
    `maintenanceMessage` VARCHAR(191) NOT NULL DEFAULT 'We''re upgrading ShijlAI Academy. Back in 2 hours!',
    `maintenanceWhitelistIps` MEDIUMTEXT NULL,
    `maintenanceScheduledStart` DATETIME(3) NULL,
    `maintenanceScheduledEnd` DATETIME(3) NULL,
    `maintenanceNotifyUsers` BOOLEAN NOT NULL DEFAULT true,
    `maintenanceNotifyHoursBefore` INTEGER NOT NULL DEFAULT 24,
    `smtpHost` VARCHAR(191) NULL,
    `smtpPort` INTEGER NOT NULL DEFAULT 587,
    `smtpSecure` BOOLEAN NOT NULL DEFAULT true,
    `smtpUser` VARCHAR(191) NULL,
    `smtpPass` VARCHAR(191) NULL,
    `smtpFromName` VARCHAR(191) NOT NULL DEFAULT 'ShijlAI Academy',
    `smtpFromEmail` VARCHAR(191) NOT NULL DEFAULT 'noreply@shijlai.academy',
    `smtpReplyTo` VARCHAR(191) NULL,
    `emailHeaderImageUrl` VARCHAR(191) NULL,
    `emailTemplateBody` MEDIUMTEXT NULL,
    `seoMetaTitle` VARCHAR(191) NULL,
    `seoMetaDescription` VARCHAR(191) NULL,
    `seoKeywords` VARCHAR(191) NULL,
    `seoRobotsTxt` VARCHAR(191) NOT NULL DEFAULT 'User-agent: *
Allow: /',
    `seoCanonicalUrl` VARCHAR(191) NULL,
    `seoSitemapEnabled` BOOLEAN NOT NULL DEFAULT true,
    `seoGoogleSiteVerification` VARCHAR(191) NULL,
    `dataRetentionDays` INTEGER NOT NULL DEFAULT 365,
    `gdprEnabled` BOOLEAN NOT NULL DEFAULT true,
    `gdprDataExportEnabled` BOOLEAN NOT NULL DEFAULT true,
    `gdprRightToBeForgotten` BOOLEAN NOT NULL DEFAULT true,
    `gdprCookieConsent` BOOLEAN NOT NULL DEFAULT true,
    `gdprPrivacyPolicyUrl` VARCHAR(191) NULL,
    `anonymizeDeletedUsers` BOOLEAN NOT NULL DEFAULT true,
    `rateLimitEnabled` BOOLEAN NOT NULL DEFAULT true,
    `rateLimitApiPerMinute` INTEGER NOT NULL DEFAULT 60,
    `rateLimitLoginPerHour` INTEGER NOT NULL DEFAULT 10,
    `rateLimitUploadPerHour` INTEGER NOT NULL DEFAULT 20,
    `moderationAutoFlag` BOOLEAN NOT NULL DEFAULT true,
    `moderationAiAssistance` BOOLEAN NOT NULL DEFAULT true,
    `moderationProfanityFilter` BOOLEAN NOT NULL DEFAULT true,
    `moderationLinkFilter` BOOLEAN NOT NULL DEFAULT false,
    `moderationMediaScan` BOOLEAN NOT NULL DEFAULT true,
    `moderationQueueThreshold` INTEGER NOT NULL DEFAULT 3,
    `allowedOrigins` MEDIUMTEXT NULL,
    `corsEnabled` BOOLEAN NOT NULL DEFAULT false,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WebhookConfig` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `secret` VARCHAR(191) NULL,
    `events` MEDIUMTEXT NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastTriggeredAt` DATETIME(3) NULL,
    `lastResponseStatus` INTEGER NULL,
    `failureCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AppearanceHistory` (
    `id` VARCHAR(191) NOT NULL,
    `snapshot` MEDIUMTEXT NOT NULL,
    `presetName` VARCHAR(191) NULL,
    `changedBy` VARCHAR(191) NULL,
    `changeDescription` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentMethodConfig` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NOT NULL,
    `isConnected` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `config` MEDIUMTEXT NULL,
    `icon` VARCHAR(191) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PaymentMethodConfig_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Integration` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `isConnected` BOOLEAN NOT NULL DEFAULT false,
    `config` MEDIUMTEXT NULL,
    `usageInfo` VARCHAR(191) NULL,
    `icon` VARCHAR(191) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Integration_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LegalPage` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL DEFAULT '',
    `lastUpdatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `LegalPage_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LearningGoal` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `target` DOUBLE NOT NULL,
    `current` DOUBLE NOT NULL DEFAULT 0,
    `unit` VARCHAR(191) NOT NULL,
    `period` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `startDate` VARCHAR(191) NOT NULL,
    `endDate` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DailyChallenge` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `target` DOUBLE NOT NULL,
    `unit` VARCHAR(191) NOT NULL,
    `xpReward` INTEGER NOT NULL DEFAULT 0,
    `coinReward` INTEGER NOT NULL DEFAULT 0,
    `icon` VARCHAR(191) NOT NULL DEFAULT '≡ƒÄ»',
    `difficulty` VARCHAR(191) NOT NULL DEFAULT 'medium',
    `date` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserChallenge` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `challengeId` VARCHAR(191) NOT NULL,
    `progress` DOUBLE NOT NULL DEFAULT 0,
    `completed` BOOLEAN NOT NULL DEFAULT false,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `UserChallenge_userId_challengeId_key`(`userId`, `challengeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StreakFreeze` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `date` VARCHAR(191) NOT NULL,
    `usedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `costCoins` INTEGER NOT NULL DEFAULT 50,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `XpActivity` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `xpAmount` INTEGER NOT NULL DEFAULT 0,
    `coinAmount` INTEGER NOT NULL DEFAULT 0,
    `description` VARCHAR(191) NOT NULL,
    `metadata` MEDIUMTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CommunityEvent` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'workshop',
    `emoji` VARCHAR(191) NOT NULL DEFAULT '≡ƒôà',
    `coverColor` VARCHAR(191) NOT NULL DEFAULT 'emerald',
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NULL,
    `duration` INTEGER NOT NULL DEFAULT 60,
    `location` VARCHAR(191) NULL,
    `meetingUrl` VARCHAR(191) NULL,
    `maxAttendees` INTEGER NULL,
    `attendeeCount` INTEGER NOT NULL DEFAULT 0,
    `isFree` BOOLEAN NOT NULL DEFAULT true,
    `status` VARCHAR(191) NOT NULL DEFAULT 'upcoming',
    `tags` MEDIUMTEXT NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NULL,
    `groupId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventAttendee` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'registered',
    `reminderSent` BOOLEAN NOT NULL DEFAULT false,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `EventAttendee_eventId_userId_key`(`eventId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudyGroupMessage` (
    `id` VARCHAR(191) NOT NULL,
    `groupId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'text',
    `attachments` MEDIUMTEXT NULL,
    `isPinned` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudyGroupResource` (
    `id` VARCHAR(191) NOT NULL,
    `groupId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `url` VARCHAR(191) NULL,
    `fileType` VARCHAR(191) NOT NULL DEFAULT 'link',
    `tags` MEDIUMTEXT NULL,
    `downloads` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ScheduleEvent` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'study',
    `color` VARCHAR(191) NOT NULL DEFAULT 'emerald',
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NULL,
    `duration` INTEGER NOT NULL DEFAULT 60,
    `allDay` BOOLEAN NOT NULL DEFAULT false,
    `location` VARCHAR(191) NULL,
    `meetingUrl` VARCHAR(191) NULL,
    `courseId` VARCHAR(191) NULL,
    `isRecurring` BOOLEAN NOT NULL DEFAULT false,
    `recurrencePattern` MEDIUMTEXT NULL,
    `reminders` MEDIUMTEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'scheduled',
    `priority` VARCHAR(191) NOT NULL DEFAULT 'medium',
    `tags` MEDIUMTEXT NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DiscussionBookmark` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `postId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `DiscussionBookmark_userId_postId_key`(`userId`, `postId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentSettings` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `headline` VARCHAR(191) NULL,
    `location` VARCHAR(191) NULL,
    `website` VARCHAR(191) NULL,
    `linkedin` VARCHAR(191) NULL,
    `learningGoalType` VARCHAR(191) NOT NULL DEFAULT 'career',
    `dailyGoalMinutes` INTEGER NOT NULL DEFAULT 30,
    `reminderTime` VARCHAR(191) NOT NULL DEFAULT '20:00',
    `videoQuality` VARCHAR(191) NOT NULL DEFAULT 'auto',
    `playbackSpeed` VARCHAR(191) NOT NULL DEFAULT '1x',
    `preferredLang` VARCHAR(191) NOT NULL DEFAULT 'en',
    `aiTutorMode` VARCHAR(191) NOT NULL DEFAULT 'socratic',
    `offlineDownloads` VARCHAR(191) NOT NULL DEFAULT 'wifi',
    `autoPlay` BOOLEAN NOT NULL DEFAULT true,
    `showSubtitles` BOOLEAN NOT NULL DEFAULT true,
    `focusMode` BOOLEAN NOT NULL DEFAULT false,
    `spacedRepetition` BOOLEAN NOT NULL DEFAULT true,
    `notifyDailyReminder` BOOLEAN NOT NULL DEFAULT true,
    `notifyAssignmentDue` BOOLEAN NOT NULL DEFAULT true,
    `notifyInstructorReply` BOOLEAN NOT NULL DEFAULT true,
    `notifyLiveSession` BOOLEAN NOT NULL DEFAULT true,
    `notifyNewCourse` BOOLEAN NOT NULL DEFAULT true,
    `notifyStreakRisk` BOOLEAN NOT NULL DEFAULT true,
    `notifyCertificate` BOOLEAN NOT NULL DEFAULT true,
    `notifyPlatformUpdates` BOOLEAN NOT NULL DEFAULT false,
    `emailDailyReminder` VARCHAR(191) NOT NULL DEFAULT 'off',
    `emailAssignmentDue` VARCHAR(191) NOT NULL DEFAULT '1_day_before',
    `emailInstructorReply` VARCHAR(191) NOT NULL DEFAULT 'immediately',
    `emailLiveSession` VARCHAR(191) NOT NULL DEFAULT '1_hour_before',
    `emailNewCourse` VARCHAR(191) NOT NULL DEFAULT 'weekly_digest',
    `emailStreakRisk` VARCHAR(191) NOT NULL DEFAULT 'off',
    `emailCertificate` VARCHAR(191) NOT NULL DEFAULT 'immediately',
    `emailPlatformUpdates` VARCHAR(191) NOT NULL DEFAULT 'off',
    `profileVisibility` VARCHAR(191) NOT NULL DEFAULT 'public',
    `showProgress` BOOLEAN NOT NULL DEFAULT true,
    `showOnLeaderboard` BOOLEAN NOT NULL DEFAULT true,
    `showCertificates` BOOLEAN NOT NULL DEFAULT true,
    `showOnlineStatus` BOOLEAN NOT NULL DEFAULT true,
    `allowMessages` VARCHAR(191) NOT NULL DEFAULT 'instructors',
    `dataSharing` BOOLEAN NOT NULL DEFAULT false,
    `theme` VARCHAR(191) NOT NULL DEFAULT 'system',
    `fontSize` VARCHAR(191) NOT NULL DEFAULT 'default',
    `compactMode` BOOLEAN NOT NULL DEFAULT false,
    `reducedMotion` BOOLEAN NOT NULL DEFAULT false,
    `sidebarPosition` VARCHAR(191) NOT NULL DEFAULT 'left',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `StudentSettings_studentId_key`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AIGeneration` (
    `id` VARCHAR(191) NOT NULL,
    `instructorId` VARCHAR(191) NOT NULL,
    `toolType` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `inputParams` MEDIUMTEXT NOT NULL,
    `resultContent` VARCHAR(191) NOT NULL,
    `resultImages` MEDIUMTEXT NULL,
    `isFavorite` BOOLEAN NOT NULL DEFAULT false,
    `tags` MEDIUMTEXT NULL,
    `courseId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AITemplate` (
    `id` VARCHAR(191) NOT NULL,
    `instructorId` VARCHAR(191) NOT NULL,
    `toolType` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `inputParams` MEDIUMTEXT NOT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `usageCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AIAssistantMessage` (
    `id` VARCHAR(191) NOT NULL,
    `instructorId` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FeatureFlag` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `rollout` INTEGER NOT NULL DEFAULT 100,
    `category` VARCHAR(191) NOT NULL DEFAULT 'general',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `FeatureFlag_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlatformSetting` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` MEDIUMTEXT NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'string',
    `category` VARCHAR(191) NOT NULL DEFAULT 'general',
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PlatformSetting_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlatformAnnouncement` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'info',
    `target` VARCHAR(191) NOT NULL DEFAULT 'all',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `startsAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CourseReviewHistory` (
    `id` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `reviewerId` VARCHAR(191) NULL,
    `reviewerName` VARCHAR(191) NULL,
    `note` VARCHAR(191) NULL,
    `checklist` MEDIUMTEXT NULL,
    `previousStatus` VARCHAR(191) NULL,
    `newStatus` VARCHAR(191) NULL,
    `metadata` MEDIUMTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CourseReviewHistory_courseId_idx`(`courseId`),
    INDEX `CourseReviewHistory_reviewerId_idx`(`reviewerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ApiUsageLog` (
    `id` VARCHAR(191) NOT NULL,
    `apiKeyId` VARCHAR(191) NULL,
    `endpoint` VARCHAR(191) NOT NULL,
    `method` VARCHAR(191) NOT NULL,
    `statusCode` INTEGER NOT NULL,
    `responseTime` INTEGER NOT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `requestBody` MEDIUMTEXT NULL,
    `userId` VARCHAR(191) NULL,
    `error` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ApiUsageLog_endpoint_idx`(`endpoint`),
    INDEX `ApiUsageLog_createdAt_idx`(`createdAt`),
    INDEX `ApiUsageLog_apiKeyId_idx`(`apiKeyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BlogPost` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `excerpt` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `tags` MEDIUMTEXT NOT NULL,
    `coverImage` VARCHAR(191) NULL,
    `gradient` VARCHAR(191) NOT NULL DEFAULT 'from-emerald-500 to-teal-600',
    `authorId` VARCHAR(191) NOT NULL,
    `authorName` VARCHAR(191) NOT NULL,
    `authorAvatar` LONGTEXT NULL,
    `authorBio` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `trending` BOOLEAN NOT NULL DEFAULT false,
    `allowComments` BOOLEAN NOT NULL DEFAULT true,
    `readTime` VARCHAR(191) NOT NULL DEFAULT '5 min read',
    `estimatedMinutes` INTEGER NOT NULL DEFAULT 5,
    `viewCount` INTEGER NOT NULL DEFAULT 0,
    `shareCount` INTEGER NOT NULL DEFAULT 0,
    `likeCount` INTEGER NOT NULL DEFAULT 0,
    `commentCount` INTEGER NOT NULL DEFAULT 0,
    `seoTitle` VARCHAR(191) NULL,
    `seoDescription` VARCHAR(191) NULL,
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `BlogPost_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentLearningProfile` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `learningLevel` VARCHAR(191) NOT NULL DEFAULT 'beginner',
    `engagementScore` DOUBLE NOT NULL DEFAULT 0,
    `consistencyScore` DOUBLE NOT NULL DEFAULT 0,
    `learningSpeedScore` DOUBLE NOT NULL DEFAULT 50,
    `dropRiskScore` DOUBLE NOT NULL DEFAULT 0,
    `completionRate` DOUBLE NOT NULL DEFAULT 0,
    `averageQuizScore` DOUBLE NOT NULL DEFAULT 0,
    `weakTopics` VARCHAR(1000) NOT NULL DEFAULT '[]',
    `strongTopics` VARCHAR(1000) NOT NULL DEFAULT '[]',
    `learningSpeed` VARCHAR(191) NOT NULL DEFAULT 'moderate',
    `recommendedTopics` VARCHAR(1000) NOT NULL DEFAULT '[]',
    `totalXpEarned` INTEGER NOT NULL DEFAULT 0,
    `totalLessonsCompleted` INTEGER NOT NULL DEFAULT 0,
    `totalQuizzesTaken` INTEGER NOT NULL DEFAULT 0,
    `totalTimeSpent` INTEGER NOT NULL DEFAULT 0,
    `studyStreakDays` INTEGER NOT NULL DEFAULT 0,
    `lastAiInteraction` DATETIME(3) NULL,
    `lastComputedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `StudentLearningProfile_studentId_key`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ShijlAISession` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL DEFAULT 'New Conversation',
    `mode` VARCHAR(191) NOT NULL DEFAULT 'tutor',
    `context` VARCHAR(191) NULL,
    `courseId` VARCHAR(191) NULL,
    `language` VARCHAR(191) NOT NULL DEFAULT 'en',
    `isArchived` BOOLEAN NOT NULL DEFAULT false,
    `messageCount` INTEGER NOT NULL DEFAULT 0,
    `summary` VARCHAR(191) NULL,
    `summaryGeneratedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ShijlAIMessage` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `mode` VARCHAR(191) NOT NULL DEFAULT 'tutor',
    `quickAction` VARCHAR(191) NULL,
    `metadata` MEDIUMTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ConversationSummary` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `summary` VARCHAR(191) NOT NULL,
    `keyTopics` VARCHAR(1000) NOT NULL DEFAULT '[]',
    `messageRangeStart` INTEGER NOT NULL,
    `messageRangeEnd` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AIRecommendation` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `reason` VARCHAR(191) NULL,
    `relatedId` VARCHAR(191) NULL,
    `relatedType` VARCHAR(191) NULL,
    `recommendedTopicId` VARCHAR(191) NULL,
    `recommendedCourseId` VARCHAR(191) NULL,
    `priority` VARCHAR(191) NOT NULL DEFAULT 'medium',
    `priorityScore` DOUBLE NOT NULL DEFAULT 50,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `sourceEvent` VARCHAR(191) NULL,
    `sourceData` MEDIUMTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LearningInsight` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'general',
    `severity` VARCHAR(191) NOT NULL DEFAULT 'info',
    `relatedData` MEDIUMTEXT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `isActionable` BOOLEAN NOT NULL DEFAULT true,
    `actionSuggestion` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AIQuizGeneration` (
    `id` VARCHAR(191) NOT NULL,
    `instructorId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NULL,
    `moduleId` VARCHAR(191) NULL,
    `topic` VARCHAR(191) NOT NULL,
    `difficulty` VARCHAR(191) NOT NULL DEFAULT 'medium',
    `questionCount` INTEGER NOT NULL DEFAULT 5,
    `questionTypes` VARCHAR(500) NOT NULL DEFAULT '[]',
    `generatedContent` MEDIUMTEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'generated',
    `reviewNotes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudyPlan` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `examDate` DATETIME(3) NULL,
    `availableHoursPerDay` DOUBLE NOT NULL DEFAULT 2,
    `subjects` VARCHAR(1000) NOT NULL DEFAULT '[]',
    `planData` VARCHAR(8000) NOT NULL DEFAULT '{}',
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `progress` DOUBLE NOT NULL DEFAULT 0,
    `targetGrade` VARCHAR(191) NULL,
    `currentGrade` VARCHAR(191) NULL,
    `courseName` VARCHAR(191) NULL,
    `totalDays` INTEGER NOT NULL DEFAULT 0,
    `completedTasks` INTEGER NOT NULL DEFAULT 0,
    `totalTasks` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudyPlanTask` (
    `id` VARCHAR(191) NOT NULL,
    `studyPlanId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `dayNumber` INTEGER NOT NULL,
    `taskType` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `duration` INTEGER NOT NULL DEFAULT 60,
    `topic` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `completedAt` DATETIME(3) NULL,
    `orderIndex` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StudyPlanTask_studyPlanId_idx`(`studyPlanId`),
    INDEX `StudyPlanTask_studyPlanId_date_idx`(`studyPlanId`, `date`),
    INDEX `StudyPlanTask_studyPlanId_status_idx`(`studyPlanId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentAIActivity` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `activityType` VARCHAR(191) NOT NULL,
    `mode` VARCHAR(191) NULL,
    `sessionId` VARCHAR(191) NULL,
    `metadata` MEDIUMTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `StudentAIActivity_userId_idx`(`userId`),
    INDEX `StudentAIActivity_userId_activityType_idx`(`userId`, `activityType`),
    INDEX `StudentAIActivity_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LearningMetric` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NULL,
    `topicId` VARCHAR(191) NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `eventValue` DOUBLE NOT NULL DEFAULT 0,
    `metadata` MEDIUMTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LearningMetric_userId_idx`(`userId`),
    INDEX `LearningMetric_userId_eventType_idx`(`userId`, `eventType`),
    INDEX `LearningMetric_userId_courseId_idx`(`userId`, `courseId`),
    INDEX `LearningMetric_userId_topicId_idx`(`userId`, `topicId`),
    INDEX `LearningMetric_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `LearningMetric_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TopicMastery` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `topicId` VARCHAR(191) NOT NULL,
    `topicName` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NULL,
    `skillId` VARCHAR(191) NULL,
    `quizScore` DOUBLE NOT NULL DEFAULT 0,
    `assignmentScore` DOUBLE NOT NULL DEFAULT 0,
    `practiceScore` DOUBLE NOT NULL DEFAULT 0,
    `completionScore` DOUBLE NOT NULL DEFAULT 0,
    `masteryScore` DOUBLE NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'not_started',
    `questionsAttempted` INTEGER NOT NULL DEFAULT 0,
    `questionsCorrect` INTEGER NOT NULL DEFAULT 0,
    `attemptCount` INTEGER NOT NULL DEFAULT 0,
    `lastAttempted` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `trend` VARCHAR(191) NOT NULL DEFAULT 'stable',
    `decayApplied` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TopicMastery_userId_idx`(`userId`),
    INDEX `TopicMastery_userId_courseId_idx`(`userId`, `courseId`),
    INDEX `TopicMastery_userId_skillId_idx`(`userId`, `skillId`),
    INDEX `TopicMastery_masteryScore_idx`(`masteryScore`),
    INDEX `TopicMastery_status_idx`(`status`),
    UNIQUE INDEX `TopicMastery_userId_topicId_key`(`userId`, `topicId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SkillTopicMapping` (
    `id` VARCHAR(191) NOT NULL,
    `skillId` VARCHAR(191) NOT NULL,
    `skillName` VARCHAR(191) NOT NULL,
    `topicId` VARCHAR(191) NOT NULL,
    `topicName` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NULL,
    `weight` DOUBLE NOT NULL DEFAULT 1.0,
    `category` VARCHAR(191) NOT NULL DEFAULT 'general',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SkillTopicMapping_skillId_idx`(`skillId`),
    INDEX `SkillTopicMapping_topicId_idx`(`topicId`),
    INDEX `SkillTopicMapping_courseId_idx`(`courseId`),
    INDEX `SkillTopicMapping_category_idx`(`category`),
    UNIQUE INDEX `SkillTopicMapping_skillId_topicId_key`(`skillId`, `topicId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LearningEvent` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NULL,
    `moduleId` VARCHAR(191) NULL,
    `lessonId` VARCHAR(191) NULL,
    `quizId` VARCHAR(191) NULL,
    `assignmentId` VARCHAR(191) NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `score` DOUBLE NULL,
    `timeSpent` INTEGER NOT NULL DEFAULT 0,
    `metadata` MEDIUMTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LearningEvent_userId_idx`(`userId`),
    INDEX `LearningEvent_userId_eventType_idx`(`userId`, `eventType`),
    INDEX `LearningEvent_userId_courseId_idx`(`userId`, `courseId`),
    INDEX `LearningEvent_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `LearningEvent_createdAt_idx`(`createdAt`),
    INDEX `LearningEvent_eventType_idx`(`eventType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuestionTopic` (
    `id` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `topicId` VARCHAR(191) NOT NULL,
    `topicName` VARCHAR(191) NOT NULL,
    `weight` DOUBLE NOT NULL DEFAULT 1.0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `QuestionTopic_questionId_idx`(`questionId`),
    INDEX `QuestionTopic_topicId_idx`(`topicId`),
    INDEX `QuestionTopic_questionId_topicId_idx`(`questionId`, `topicId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AIGeneratedOutline` (
    `id` VARCHAR(191) NOT NULL,
    `instructorId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NULL,
    `prompt` VARCHAR(191) NOT NULL,
    `generatedContent` MEDIUMTEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'generated',
    `editedContent` MEDIUMTEXT NULL,
    `reviewNotes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AIGeneratedOutline_instructorId_idx`(`instructorId`),
    INDEX `AIGeneratedOutline_courseId_idx`(`courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AIGeneratedLesson` (
    `id` VARCHAR(191) NOT NULL,
    `instructorId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NULL,
    `topic` VARCHAR(191) NOT NULL,
    `structureContent` MEDIUMTEXT NULL,
    `lessonContent` MEDIUMTEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'structure_generated',
    `editedContent` VARCHAR(191) NULL,
    `reviewNotes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AIGeneratedLesson_instructorId_idx`(`instructorId`),
    INDEX `AIGeneratedLesson_courseId_idx`(`courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AIGeneratedAssignment` (
    `id` VARCHAR(191) NOT NULL,
    `instructorId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NULL,
    `topic` VARCHAR(191) NOT NULL,
    `difficulty` VARCHAR(191) NOT NULL DEFAULT 'medium',
    `generatedContent` MEDIUMTEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'generated',
    `editedContent` VARCHAR(191) NULL,
    `reviewNotes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AIGeneratedAssignment_instructorId_idx`(`instructorId`),
    INDEX `AIGeneratedAssignment_courseId_idx`(`courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AIGeneratedRubric` (
    `id` VARCHAR(191) NOT NULL,
    `instructorId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NULL,
    `assignmentId` VARCHAR(191) NULL,
    `topic` VARCHAR(191) NOT NULL,
    `generatedContent` MEDIUMTEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'generated',
    `editedContent` VARCHAR(191) NULL,
    `reviewNotes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AIGeneratedRubric_instructorId_idx`(`instructorId`),
    INDEX `AIGeneratedRubric_courseId_idx`(`courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AIGeneratedQuiz` (
    `id` VARCHAR(191) NOT NULL,
    `instructorId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NULL,
    `topic` VARCHAR(191) NOT NULL,
    `questionTypes` VARCHAR(500) NOT NULL DEFAULT '[]',
    `difficulty` VARCHAR(191) NOT NULL DEFAULT 'medium',
    `questionCount` INTEGER NOT NULL DEFAULT 5,
    `generatedContent` MEDIUMTEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'generated',
    `editedContent` VARCHAR(191) NULL,
    `reviewNotes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AIGeneratedQuiz_instructorId_idx`(`instructorId`),
    INDEX `AIGeneratedQuiz_courseId_idx`(`courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InstructorAIActivity` (
    `id` VARCHAR(191) NOT NULL,
    `instructorId` VARCHAR(191) NOT NULL,
    `activityType` VARCHAR(191) NOT NULL,
    `moduleType` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `metadata` MEDIUMTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `InstructorAIActivity_instructorId_idx`(`instructorId`),
    INDEX `InstructorAIActivity_instructorId_activityType_idx`(`instructorId`, `activityType`),
    INDEX `InstructorAIActivity_instructorId_createdAt_idx`(`instructorId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LearningOutcome` (
    `id` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LearningOutcome_courseId_idx`(`courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuestionOutcome` (
    `id` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `outcomeId` VARCHAR(191) NOT NULL,

    INDEX `QuestionOutcome_questionId_idx`(`questionId`),
    INDEX `QuestionOutcome_outcomeId_idx`(`outcomeId`),
    UNIQUE INDEX `QuestionOutcome_questionId_outcomeId_key`(`questionId`, `outcomeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuestionAnalytics` (
    `id` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `correctAttempts` INTEGER NOT NULL DEFAULT 0,
    `incorrectAttempts` INTEGER NOT NULL DEFAULT 0,
    `successRate` DOUBLE NOT NULL DEFAULT 0,
    `difficultyScore` DOUBLE NOT NULL DEFAULT 0,
    `difficultyLevel` VARCHAR(191) NOT NULL DEFAULT 'normal',
    `lastUpdated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `QuestionAnalytics_questionId_key`(`questionId`),
    INDEX `QuestionAnalytics_difficultyLevel_idx`(`difficultyLevel`),
    INDEX `QuestionAnalytics_successRate_idx`(`successRate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DistractorAnalytics` (
    `id` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `optionLabel` VARCHAR(191) NOT NULL,
    `optionText` VARCHAR(191) NOT NULL,
    `selectionCount` INTEGER NOT NULL DEFAULT 0,
    `selectionRate` DOUBLE NOT NULL DEFAULT 0,
    `isCorrect` BOOLEAN NOT NULL DEFAULT false,
    `isWeak` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DistractorAnalytics_questionId_idx`(`questionId`),
    UNIQUE INDEX `DistractorAnalytics_questionId_optionLabel_key`(`questionId`, `optionLabel`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AssessmentQualityScore` (
    `id` VARCHAR(191) NOT NULL,
    `quizId` VARCHAR(191) NOT NULL,
    `difficultyBalance` DOUBLE NOT NULL DEFAULT 0,
    `questionVariety` DOUBLE NOT NULL DEFAULT 0,
    `outcomeCoverage` DOUBLE NOT NULL DEFAULT 0,
    `avgCompletionTime` DOUBLE NOT NULL DEFAULT 0,
    `overallScore` DOUBLE NOT NULL DEFAULT 0,
    `calculatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AssessmentQualityScore_quizId_key`(`quizId`),
    INDEX `AssessmentQualityScore_quizId_idx`(`quizId`),
    INDEX `AssessmentQualityScore_overallScore_idx`(`overallScore`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CourseSkill` (
    `id` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `skillId` VARCHAR(191) NOT NULL,
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `weight` DOUBLE NOT NULL DEFAULT 1.0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CourseSkill_courseId_idx`(`courseId`),
    INDEX `CourseSkill_skillId_idx`(`skillId`),
    UNIQUE INDEX `CourseSkill_courseId_skillId_key`(`courseId`, `skillId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LessonSkill` (
    `id` VARCHAR(191) NOT NULL,
    `lessonId` VARCHAR(191) NOT NULL,
    `skillId` VARCHAR(191) NOT NULL,
    `weight` DOUBLE NOT NULL DEFAULT 1.0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LessonSkill_lessonId_idx`(`lessonId`),
    INDEX `LessonSkill_skillId_idx`(`skillId`),
    UNIQUE INDEX `LessonSkill_lessonId_skillId_key`(`lessonId`, `skillId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuestionSkill` (
    `id` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `skillId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `QuestionSkill_questionId_idx`(`questionId`),
    INDEX `QuestionSkill_skillId_idx`(`skillId`),
    UNIQUE INDEX `QuestionSkill_questionId_skillId_key`(`questionId`, `skillId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentSkillHistory` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `skillId` VARCHAR(191) NOT NULL,
    `userSkillId` VARCHAR(191) NOT NULL,
    `score` DOUBLE NOT NULL,
    `level` VARCHAR(191) NOT NULL,
    `event` VARCHAR(191) NULL,
    `recordedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `StudentSkillHistory_userId_skillId_idx`(`userId`, `skillId`),
    INDEX `StudentSkillHistory_userId_skillId_recordedAt_idx`(`userId`, `skillId`, `recordedAt`),
    INDEX `StudentSkillHistory_recordedAt_idx`(`recordedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CareerPath` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `icon` VARCHAR(191) NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'engineering',
    `nextPathId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `CareerPath_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CareerPathSkill` (
    `id` VARCHAR(191) NOT NULL,
    `careerPathId` VARCHAR(191) NOT NULL,
    `skillId` VARCHAR(191) NOT NULL,
    `requiredLevel` VARCHAR(191) NOT NULL,
    `requiredScore` INTEGER NOT NULL DEFAULT 60,
    `priority` VARCHAR(191) NOT NULL DEFAULT 'must_have',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CareerPathSkill_careerPathId_idx`(`careerPathId`),
    INDEX `CareerPathSkill_skillId_idx`(`skillId`),
    UNIQUE INDEX `CareerPathSkill_careerPathId_skillId_key`(`careerPathId`, `skillId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LearningPath` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NULL,
    `careerPathId` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `progress` DOUBLE NOT NULL DEFAULT 0,
    `generatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LearningPath_studentId_idx`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LearningPathNode` (
    `id` VARCHAR(191) NOT NULL,
    `pathId` VARCHAR(191) NOT NULL,
    `nodeType` VARCHAR(191) NOT NULL,
    `nodeId` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `sequenceOrder` INTEGER NOT NULL DEFAULT 0,
    `priority` VARCHAR(191) NOT NULL DEFAULT 'normal',
    `status` VARCHAR(191) NOT NULL DEFAULT 'locked',
    `masteryRequired` DOUBLE NOT NULL DEFAULT 0,
    `masteryScore` DOUBLE NOT NULL DEFAULT 0,
    `xpReward` INTEGER NOT NULL DEFAULT 0,
    `duration` INTEGER NOT NULL DEFAULT 0,
    `metadata` MEDIUMTEXT NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LearningPathNode_pathId_sequenceOrder_idx`(`pathId`, `sequenceOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TopicPrerequisite` (
    `id` VARCHAR(191) NOT NULL,
    `topicId` VARCHAR(191) NOT NULL,
    `prerequisiteTopicId` VARCHAR(191) NOT NULL,
    `requiredMastery` DOUBLE NOT NULL DEFAULT 50,

    UNIQUE INDEX `TopicPrerequisite_topicId_prerequisiteTopicId_key`(`topicId`, `prerequisiteTopicId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AICompanionMessage` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `messageType` VARCHAR(191) NOT NULL,
    `priority` VARCHAR(191) NOT NULL DEFAULT 'normal',
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `actionType` VARCHAR(191) NULL,
    `actionData` MEDIUMTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AICompanionMessage_studentId_isRead_idx`(`studentId`, `isRead`),
    INDEX `AICompanionMessage_studentId_createdAt_idx`(`studentId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AICompanionEvent` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `eventData` MEDIUMTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AICompanionEvent_studentId_eventType_idx`(`studentId`, `eventType`),
    INDEX `AICompanionEvent_studentId_createdAt_idx`(`studentId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MockInterview` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `domain` VARCHAR(191) NOT NULL,
    `difficulty` VARCHAR(191) NOT NULL DEFAULT 'intermediate',
    `interviewType` VARCHAR(191) NOT NULL DEFAULT 'technical',
    `status` VARCHAR(191) NOT NULL DEFAULT 'in_progress',
    `score` DOUBLE NOT NULL DEFAULT 0,
    `accuracy` DOUBLE NOT NULL DEFAULT 0,
    `completeness` DOUBLE NOT NULL DEFAULT 0,
    `clarity` DOUBLE NOT NULL DEFAULT 0,
    `confidence` DOUBLE NOT NULL DEFAULT 0,
    `feedback` VARCHAR(191) NULL,
    `strengths` MEDIUMTEXT NULL,
    `weaknesses` MEDIUMTEXT NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `MockInterview_studentId_domain_idx`(`studentId`, `domain`),
    INDEX `MockInterview_studentId_completedAt_idx`(`studentId`, `completedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InterviewQuestion` (
    `id` VARCHAR(191) NOT NULL,
    `interviewId` VARCHAR(191) NOT NULL,
    `question` VARCHAR(191) NOT NULL,
    `questionType` VARCHAR(191) NOT NULL,
    `topic` VARCHAR(191) NULL,
    `difficulty` VARCHAR(191) NOT NULL DEFAULT 'intermediate',
    `studentAnswer` VARCHAR(191) NULL,
    `evaluation` VARCHAR(191) NULL,
    `score` DOUBLE NOT NULL DEFAULT 0,
    `idealAnswer` VARCHAR(191) NULL,
    `feedback` VARCHAR(191) NULL,
    `orderIndex` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GeneratedReport` (
    `id` VARCHAR(191) NOT NULL,
    `reportType` VARCHAR(191) NOT NULL,
    `period` VARCHAR(191) NOT NULL,
    `periodStart` DATETIME(3) NOT NULL,
    `periodEnd` DATETIME(3) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'generating',
    `generatedBy` VARCHAR(191) NULL,
    `courseId` VARCHAR(191) NULL,
    `instructorId` VARCHAR(191) NULL,
    `reportData` MEDIUMTEXT NULL,
    `reportSummary` MEDIUMTEXT NULL,
    `errorMessage` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `GeneratedReport_reportType_idx`(`reportType`),
    INDEX `GeneratedReport_status_idx`(`status`),
    INDEX `GeneratedReport_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CourseQualityAnalysis` (
    `id` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `qualityScore` DOUBLE NOT NULL DEFAULT 0,
    `structureScore` DOUBLE NOT NULL DEFAULT 0,
    `assessmentScore` DOUBLE NOT NULL DEFAULT 0,
    `successScore` DOUBLE NOT NULL DEFAULT 0,
    `engagementScore` DOUBLE NOT NULL DEFAULT 0,
    `contentScore` DOUBLE NOT NULL DEFAULT 0,
    `strengths` MEDIUMTEXT NULL,
    `weaknesses` MEDIUMTEXT NULL,
    `recommendations` MEDIUMTEXT NULL,
    `aiAnalysis` VARCHAR(191) NULL,
    `analyzedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CourseQualityAnalysis_courseId_key`(`courseId`),
    INDEX `CourseQualityAnalysis_qualityScore_idx`(`qualityScore`),
    INDEX `CourseQualityAnalysis_courseId_idx`(`courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ActivityLog` ADD CONSTRAINT `ActivityLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InstructorApplication` ADD CONSTRAINT `InstructorApplication_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ApplicationTimeline` ADD CONSTRAINT `ApplicationTimeline_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `InstructorApplication`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ApplicationInterview` ADD CONSTRAINT `ApplicationInterview_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `InstructorApplication`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Course` ADD CONSTRAINT `Course_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Module` ADD CONSTRAINT `Module_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Lesson` ADD CONSTRAINT `Lesson_moduleId_fkey` FOREIGN KEY (`moduleId`) REFERENCES `Module`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Enrollment` ADD CONSTRAINT `Enrollment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Enrollment` ADD CONSTRAINT `Enrollment_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LessonProgress` ADD CONSTRAINT `LessonProgress_enrollmentId_fkey` FOREIGN KEY (`enrollmentId`) REFERENCES `Enrollment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LessonProgress` ADD CONSTRAINT `LessonProgress_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `Lesson`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Quiz` ADD CONSTRAINT `Quiz_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Assignment` ADD CONSTRAINT `Assignment_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Question` ADD CONSTRAINT `Question_quizId_fkey` FOREIGN KEY (`quizId`) REFERENCES `Quiz`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuizAttempt` ADD CONSTRAINT `QuizAttempt_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuizAttempt` ADD CONSTRAINT `QuizAttempt_quizId_fkey` FOREIGN KEY (`quizId`) REFERENCES `Quiz`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserBadge` ADD CONSTRAINT `UserBadge_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserBadge` ADD CONSTRAINT `UserBadge_badgeId_fkey` FOREIGN KEY (`badgeId`) REFERENCES `Badge`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Certificate` ADD CONSTRAINT `Certificate_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TutorSession` ADD CONSTRAINT `TutorSession_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMessage` ADD CONSTRAINT `ChatMessage_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMessage` ADD CONSTRAINT `ChatMessage_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `TutorSession`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ParentLink` ADD CONSTRAINT `ParentLink_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ParentLink` ADD CONSTRAINT `ParentLink_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QAQuestion` ADD CONSTRAINT `QAQuestion_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QAQuestion` ADD CONSTRAINT `QAQuestion_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QAQuestion` ADD CONSTRAINT `QAQuestion_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `Lesson`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QAAnswer` ADD CONSTRAINT `QAAnswer_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `QAQuestion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QAAnswer` ADD CONSTRAINT `QAAnswer_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QAUpvote` ADD CONSTRAINT `QAUpvote_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `QAQuestion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QAUpvote` ADD CONSTRAINT `QAUpvote_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QAAnswerUpvote` ADD CONSTRAINT `QAAnswerUpvote_answerId_fkey` FOREIGN KEY (`answerId`) REFERENCES `QAAnswer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QAAnswerUpvote` ADD CONSTRAINT `QAAnswerUpvote_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QASettings` ADD CONSTRAINT `QASettings_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Submission` ADD CONSTRAINT `Submission_assignmentId_fkey` FOREIGN KEY (`assignmentId`) REFERENCES `Assignment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Submission` ADD CONSTRAINT `Submission_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PayoutMethod` ADD CONSTRAINT `PayoutMethod_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payout` ADD CONSTRAINT `Payout_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConversationParticipant` ADD CONSTRAINT `ConversationParticipant_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `Conversation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConversationParticipant` ADD CONSTRAINT `ConversationParticipant_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `Conversation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NotificationPreference` ADD CONSTRAINT `NotificationPreference_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InstructorProfile` ADD CONSTRAINT `InstructorProfile_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InstructorSettings` ADD CONSTRAINT `InstructorSettings_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserSession` ADD CONSTRAINT `UserSession_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LiveSession` ADD CONSTRAINT `LiveSession_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LiveSession` ADD CONSTRAINT `LiveSession_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SessionAttendee` ADD CONSTRAINT `SessionAttendee_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `LiveSession`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SessionAttendee` ADD CONSTRAINT `SessionAttendee_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Wishlist` ADD CONSTRAINT `Wishlist_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Wishlist` ADD CONSTRAINT `Wishlist_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_enrollmentId_fkey` FOREIGN KEY (`enrollmentId`) REFERENCES `Enrollment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LessonNote` ADD CONSTRAINT `LessonNote_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LessonNote` ADD CONSTRAINT `LessonNote_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `Lesson`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LessonNote` ADD CONSTRAINT `LessonNote_enrollmentId_fkey` FOREIGN KEY (`enrollmentId`) REFERENCES `Enrollment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LessonBookmark` ADD CONSTRAINT `LessonBookmark_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LessonBookmark` ADD CONSTRAINT `LessonBookmark_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `Lesson`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LessonBookmark` ADD CONSTRAINT `LessonBookmark_enrollmentId_fkey` FOREIGN KEY (`enrollmentId`) REFERENCES `Enrollment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Skill` ADD CONSTRAINT `Skill_parentSkillId_fkey` FOREIGN KEY (`parentSkillId`) REFERENCES `Skill`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserSkill` ADD CONSTRAINT `UserSkill_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserSkill` ADD CONSTRAINT `UserSkill_skillId_fkey` FOREIGN KEY (`skillId`) REFERENCES `Skill`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DiscussionPost` ADD CONSTRAINT `DiscussionPost_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DiscussionPost` ADD CONSTRAINT `DiscussionPost_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DiscussionReply` ADD CONSTRAINT `DiscussionReply_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `DiscussionPost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DiscussionReply` ADD CONSTRAINT `DiscussionReply_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DiscussionUpvote` ADD CONSTRAINT `DiscussionUpvote_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `DiscussionPost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DiscussionUpvote` ADD CONSTRAINT `DiscussionUpvote_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudyGroup` ADD CONSTRAINT `StudyGroup_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudyGroup` ADD CONSTRAINT `StudyGroup_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudyGroupMember` ADD CONSTRAINT `StudyGroupMember_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `StudyGroup`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudyGroupMember` ADD CONSTRAINT `StudyGroupMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PeerReview` ADD CONSTRAINT `PeerReview_assignmentId_fkey` FOREIGN KEY (`assignmentId`) REFERENCES `Assignment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PeerReview` ADD CONSTRAINT `PeerReview_reviewerId_fkey` FOREIGN KEY (`reviewerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PeerReview` ADD CONSTRAINT `PeerReview_revieweeId_fkey` FOREIGN KEY (`revieweeId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dispute` ADD CONSTRAINT `Dispute_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `Transaction`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CommissionOverride` ADD CONSTRAINT `CommissionOverride_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StreakReward` ADD CONSTRAINT `StreakReward_badgeId_fkey` FOREIGN KEY (`badgeId`) REFERENCES `Badge`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserReward` ADD CONSTRAINT `UserReward_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserReward` ADD CONSTRAINT `UserReward_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `RewardShopItem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AIModel` ADD CONSTRAINT `AIModel_providerId_fkey` FOREIGN KEY (`providerId`) REFERENCES `AIProvider`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AIUsageLog` ADD CONSTRAINT `AIUsageLog_providerId_fkey` FOREIGN KEY (`providerId`) REFERENCES `AIProvider`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AIUsageLog` ADD CONSTRAINT `AIUsageLog_modelId_fkey` FOREIGN KEY (`modelId`) REFERENCES `AIModel`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LearningGoal` ADD CONSTRAINT `LearningGoal_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserChallenge` ADD CONSTRAINT `UserChallenge_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserChallenge` ADD CONSTRAINT `UserChallenge_challengeId_fkey` FOREIGN KEY (`challengeId`) REFERENCES `DailyChallenge`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StreakFreeze` ADD CONSTRAINT `StreakFreeze_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `XpActivity` ADD CONSTRAINT `XpActivity_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CommunityEvent` ADD CONSTRAINT `CommunityEvent_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CommunityEvent` ADD CONSTRAINT `CommunityEvent_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CommunityEvent` ADD CONSTRAINT `CommunityEvent_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `StudyGroup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventAttendee` ADD CONSTRAINT `EventAttendee_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `CommunityEvent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventAttendee` ADD CONSTRAINT `EventAttendee_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudyGroupMessage` ADD CONSTRAINT `StudyGroupMessage_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `StudyGroup`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudyGroupMessage` ADD CONSTRAINT `StudyGroupMessage_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudyGroupResource` ADD CONSTRAINT `StudyGroupResource_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `StudyGroup`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudyGroupResource` ADD CONSTRAINT `StudyGroupResource_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScheduleEvent` ADD CONSTRAINT `ScheduleEvent_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScheduleEvent` ADD CONSTRAINT `ScheduleEvent_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DiscussionBookmark` ADD CONSTRAINT `DiscussionBookmark_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DiscussionBookmark` ADD CONSTRAINT `DiscussionBookmark_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `DiscussionPost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentSettings` ADD CONSTRAINT `StudentSettings_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AIGeneration` ADD CONSTRAINT `AIGeneration_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AIGeneration` ADD CONSTRAINT `AIGeneration_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AITemplate` ADD CONSTRAINT `AITemplate_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AIAssistantMessage` ADD CONSTRAINT `AIAssistantMessage_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseReviewHistory` ADD CONSTRAINT `CourseReviewHistory_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BlogPost` ADD CONSTRAINT `BlogPost_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentLearningProfile` ADD CONSTRAINT `StudentLearningProfile_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ShijlAISession` ADD CONSTRAINT `ShijlAISession_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ShijlAIMessage` ADD CONSTRAINT `ShijlAIMessage_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `ShijlAISession`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ShijlAIMessage` ADD CONSTRAINT `ShijlAIMessage_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConversationSummary` ADD CONSTRAINT `ConversationSummary_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `ShijlAISession`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AIRecommendation` ADD CONSTRAINT `AIRecommendation_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LearningInsight` ADD CONSTRAINT `LearningInsight_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AIQuizGeneration` ADD CONSTRAINT `AIQuizGeneration_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudyPlan` ADD CONSTRAINT `StudyPlan_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudyPlanTask` ADD CONSTRAINT `StudyPlanTask_studyPlanId_fkey` FOREIGN KEY (`studyPlanId`) REFERENCES `StudyPlan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentAIActivity` ADD CONSTRAINT `StudentAIActivity_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LearningMetric` ADD CONSTRAINT `LearningMetric_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TopicMastery` ADD CONSTRAINT `TopicMastery_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LearningEvent` ADD CONSTRAINT `LearningEvent_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AIGeneratedOutline` ADD CONSTRAINT `AIGeneratedOutline_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AIGeneratedOutline` ADD CONSTRAINT `AIGeneratedOutline_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AIGeneratedLesson` ADD CONSTRAINT `AIGeneratedLesson_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AIGeneratedLesson` ADD CONSTRAINT `AIGeneratedLesson_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AIGeneratedAssignment` ADD CONSTRAINT `AIGeneratedAssignment_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AIGeneratedAssignment` ADD CONSTRAINT `AIGeneratedAssignment_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AIGeneratedRubric` ADD CONSTRAINT `AIGeneratedRubric_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AIGeneratedRubric` ADD CONSTRAINT `AIGeneratedRubric_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AIGeneratedRubric` ADD CONSTRAINT `AIGeneratedRubric_assignmentId_fkey` FOREIGN KEY (`assignmentId`) REFERENCES `Assignment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AIGeneratedQuiz` ADD CONSTRAINT `AIGeneratedQuiz_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AIGeneratedQuiz` ADD CONSTRAINT `AIGeneratedQuiz_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InstructorAIActivity` ADD CONSTRAINT `InstructorAIActivity_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LearningOutcome` ADD CONSTRAINT `LearningOutcome_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuestionOutcome` ADD CONSTRAINT `QuestionOutcome_outcomeId_fkey` FOREIGN KEY (`outcomeId`) REFERENCES `LearningOutcome`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseSkill` ADD CONSTRAINT `CourseSkill_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseSkill` ADD CONSTRAINT `CourseSkill_skillId_fkey` FOREIGN KEY (`skillId`) REFERENCES `Skill`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LessonSkill` ADD CONSTRAINT `LessonSkill_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `Lesson`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LessonSkill` ADD CONSTRAINT `LessonSkill_skillId_fkey` FOREIGN KEY (`skillId`) REFERENCES `Skill`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuestionSkill` ADD CONSTRAINT `QuestionSkill_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuestionSkill` ADD CONSTRAINT `QuestionSkill_skillId_fkey` FOREIGN KEY (`skillId`) REFERENCES `Skill`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentSkillHistory` ADD CONSTRAINT `StudentSkillHistory_userSkillId_fkey` FOREIGN KEY (`userSkillId`) REFERENCES `UserSkill`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CareerPath` ADD CONSTRAINT `CareerPath_nextPathId_fkey` FOREIGN KEY (`nextPathId`) REFERENCES `CareerPath`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CareerPathSkill` ADD CONSTRAINT `CareerPathSkill_careerPathId_fkey` FOREIGN KEY (`careerPathId`) REFERENCES `CareerPath`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CareerPathSkill` ADD CONSTRAINT `CareerPathSkill_skillId_fkey` FOREIGN KEY (`skillId`) REFERENCES `Skill`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LearningPath` ADD CONSTRAINT `LearningPath_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LearningPath` ADD CONSTRAINT `LearningPath_careerPathId_fkey` FOREIGN KEY (`careerPathId`) REFERENCES `CareerPath`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LearningPathNode` ADD CONSTRAINT `LearningPathNode_pathId_fkey` FOREIGN KEY (`pathId`) REFERENCES `LearningPath`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AICompanionMessage` ADD CONSTRAINT `AICompanionMessage_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AICompanionEvent` ADD CONSTRAINT `AICompanionEvent_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MockInterview` ADD CONSTRAINT `MockInterview_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InterviewQuestion` ADD CONSTRAINT `InterviewQuestion_interviewId_fkey` FOREIGN KEY (`interviewId`) REFERENCES `MockInterview`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseQualityAnalysis` ADD CONSTRAINT `CourseQualityAnalysis_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

