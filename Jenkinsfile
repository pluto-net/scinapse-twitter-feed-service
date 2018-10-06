pipeline {
    agent any

    tools {nodejs "Node810"}

    environment {
        TWITTER_SERVICE_KEY = credentials('TWITTER_SERVICE_KEY')
        TWITTER_SECRET_KEY= credentials("TWITTER_SECRET_KEY")
    }

    stages {
        stage('Checkout') {
            steps {
                slackSend color: 'good', channel: "#ci-build", message: "scinapse-twitter-feed-service Build Started: ${env.BRANCH_NAME}"
                checkout scm
                sh 'git status'
            }
        }

        stage('clean artifacts'){
            steps {
                script {
                    sh 'rm -rf output'
                    sh 'rm -rf node_modules'
                    sh 'npm cache clean -f'
                }
            }
        }

        stage('Install dependencies'){
            steps {
                script {
                    try {
                        sh 'npm --version'
                        sh 'npm ci'
                    } catch (err) {
                        slackSend color: "danger", channel: "#ci-build", failOnError: true, message: "Build Failed at NPM INSTAL: ${env.BRANCH_NAME}"
                        throw err
                    }
                }
            }
        }
        stage('Deploy') {
            steps {
                script {
                    try {
                        sh 'npm run deploy'
                        slackSend color: 'good', channel: "#ci-build", message: "scinapse-twitter-feed-service Deploy DONE!"
                    } catch (err) {
                        slackSend color: "danger", failOnError: true, message: "Build Failed at BUILD & DEPLOY: ${env.BRANCH_NAME}"
                        throw err
                    }
                }
            }
        }
    }

    post {
        always {
            deleteDir()
        }
    }
}