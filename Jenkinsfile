pipeline {
    agent any

    parameters {
        choice(
            name: 'ACTION',
            choices: ['DEPLOY', 'ROLLBACK'],
            description: 'Choose deployment action'
        )

        string(
            name: 'ROLLBACK_TAG',
            defaultValue: '10',
            description: 'Docker image tag to deploy during rollback'
        )
    }

    environment {
        DOCKER_BUILDKIT = '1'
        COMPOSE_DOCKER_CLI_BUILD = '1'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm

                sh '''
                    echo "Current commit:"
                    git rev-parse --short HEAD

                    echo "Commit message:"
                    git log -1 --pretty=%B
                '''
            }
        }

        stage('Prepare Environment') {
            steps {
                withCredentials([
                    string(credentialsId: 'DB_USER', variable: 'DB_USER'),
                    string(credentialsId: 'DB_PASSWORD', variable: 'DB_PASSWORD'),
                    string(credentialsId: 'DB_NAME', variable: 'DB_NAME'),
                    string(credentialsId: 'DB_ROOT_PASSWORD', variable: 'DB_ROOT_PASSWORD')
                ]) {
                    sh '''
                        if [ "$ACTION" = "ROLLBACK" ]; then
                            IMAGE_TAG="$ROLLBACK_TAG"
                            echo "ROLLBACK selected"
                            echo "Rollback image tag: $IMAGE_TAG"
                        else
                            IMAGE_TAG="$BUILD_NUMBER"
                            echo "DEPLOY selected"
                            echo "Deployment image tag: $IMAGE_TAG"
                        fi

                        cat > .env <<EOF
IMAGE_TAG=$IMAGE_TAG
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME
DB_ROOT_PASSWORD=$DB_ROOT_PASSWORD
EOF

                        echo "Environment prepared"
                        grep -E '^(IMAGE_TAG|DB_NAME)=' .env
                    '''
                }
            }
        }

        stage('Build Application') {
            when {
                expression {
                    params.ACTION == 'DEPLOY'
                }
            }

            steps {
                sh '''
                    docker compose --env-file .env build --pull
                '''
            }
        }

        stage('Application Tests') {
            when {
                expression {
                    params.ACTION == 'DEPLOY'
                }
            }

            steps {
                dir('backend') {
                    sh '''
                        npm ci
                        npm test
                    '''
                }
            }
        }

        stage('Trivy Security Scan') {
            when {
                expression {
                    params.ACTION == 'DEPLOY'
                }
            }

            steps {
                sh '''
                    mkdir -p reports

                    echo "Scanning backend image..."
                    trivy image \
                        --format table \
                        --output reports/trivy-backend.txt \
                        employee-management-cicd-backend:$BUILD_NUMBER || true

                    trivy image \
                        --format json \
                        --output reports/trivy-backend.json \
                        employee-management-cicd-backend:$BUILD_NUMBER || true

                    echo "Scanning frontend image..."
                    trivy image \
                        --format table \
                        --output reports/trivy-frontend.txt \
                        employee-management-cicd-frontend:$BUILD_NUMBER || true

                    trivy image \
                        --format json \
                        --output reports/trivy-frontend.json \
                        employee-management-cicd-frontend:$BUILD_NUMBER || true
                '''
            }

            post {
                always {
                    archiveArtifacts(
                        artifacts: 'reports/*',
                        allowEmptyArchive: true
                    )
                }
            }
        }

        stage('Verify Rollback Images') {
            when {
                expression {
                    params.ACTION == 'ROLLBACK'
                }
            }

            steps {
                sh '''
                    echo "Checking rollback images..."

                    docker image inspect \
                        employee-management-cicd-backend:$ROLLBACK_TAG

                    docker image inspect \
                        employee-management-cicd-frontend:$ROLLBACK_TAG

                    echo "Rollback images found successfully"
                '''
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    echo "Starting deployment..."

                    docker compose --env-file .env config | grep -E 'image:'

                    if [ "$ACTION" = "ROLLBACK" ]; then
                        echo "Performing rollback to image tag $ROLLBACK_TAG"

                        docker compose \
                            --env-file .env \
                            up -d \
                            --no-build \
                            --force-recreate
                    else
                        echo "Performing normal deployment of build $BUILD_NUMBER"

                        docker compose \
                            --env-file .env \
                            up -d \
                            --force-recreate
                    fi

                    echo "Running containers:"
                    docker compose --env-file .env ps
                '''
            }
        }

        stage('Health Check') {
            steps {
                sh '''
                    echo "Waiting for services..."
                    sleep 15

                    echo "Container status:"
                    docker compose --env-file .env ps

                    echo "Checking backend health..."
                    docker compose \
                        --env-file .env \
                        exec -T backend \
                        node -e "require('http').get('http://localhost:3000/health',r=>{console.log('Backend HTTP status:',r.statusCode);process.exit(r.statusCode===200?0:1)}).on('error',e=>{console.error(e.message);process.exit(1)})"

                    echo "Checking frontend..."
                    curl -f http://localhost/

                    echo "Health checks passed"
                '''
            }
        }

        stage('Image Cleanup') {
            steps {
                sh '''
                    echo "Cleaning unused Docker images..."

                    docker image prune -f

                    echo "Remaining application images:"
                    docker images \
                        --filter=reference='employee-management-cicd-backend:*' \
                        --filter=reference='employee-management-cicd-frontend:*'
                '''
            }
        }
    }

    post {
        always {
            sh '''
                echo "Final container status:"
                docker ps -a \
                    --filter name=employee-backend \
                    --filter name=employee-frontend \
                    --filter name=employee-db || true

                echo "Removing temporary environment file..."
                rm -f .env
            '''
        }

        success {
            echo 'CI/CD pipeline completed successfully.'
        }

        failure {
            echo 'CI/CD pipeline failed. Check the stage logs above.'
        }
    }
}
