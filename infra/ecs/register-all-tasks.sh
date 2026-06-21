#!/usr/bin/env bash
# Sprint 16 — Register all ECS Fargate task definitions
# Usage: ECR_REGISTRY=123456789.dkr.ecr.ap-south-1.amazonaws.com ACCOUNT_ID=123456789 ./register-all-tasks.sh

set -euo pipefail

ECR_REGISTRY=${ECR_REGISTRY:?ECR_REGISTRY required}
ACCOUNT_ID=${ACCOUNT_ID:?ACCOUNT_ID required}
REGION=ap-south-1

declare -A SERVICES=(
  [auth-service]=3001
  [inventory-service]=3002
  [order-service]=3003
  [payment-service]=3005
  [notification-service]=3006
  [logistics-service]=3007
  [analytics-service]=3008
  [dispute-service]=3009
  [invoice-service]=3011
  [search-service]=3004
)

for SERVICE in "${!SERVICES[@]}"; do
  PORT="${SERVICES[$SERVICE]}"
  echo "→ Registering task definition for $SERVICE (port $PORT)..."

  # Generate task definition from template
  TASK_JSON=$(sed \
    -e "s/SERVICE_NAME/$SERVICE/g" \
    -e "s/SERVICE_PORT/$PORT/g" \
    -e "s|ECR_REGISTRY|$ECR_REGISTRY|g" \
    -e "s/ACCOUNT_ID/$ACCOUNT_ID/g" \
    infra/ecs/task-definition-template.json)

  # Strip comments (jq removes _comment keys)
  TASK_JSON=$(echo "$TASK_JSON" | jq 'walk(if type == "object" then del(._comment, ._usage) else . end)')

  aws ecs register-task-definition \
    --region "$REGION" \
    --cli-input-json "$TASK_JSON" \
    --query 'taskDefinition.taskDefinitionArn' \
    --output text

  echo "  ✓ $SERVICE registered"
done

echo ""
echo "✅ All task definitions registered. Now run register-all-tasks.sh and then deploy:"
echo "   ./infra/ecs/deploy.sh"
