https://velog.io/@new_wisdom/AWS-EC2%EC%97%90-Node.jsExpress-pm2-nginx-배포하기#-ubuntu-기본-세팅--nodejs-pm2-nginx-설치

54.180.202.222

### 학습목표

프로젝트 빌드 후 운영모드(production)로 각각의 포트로 인스턴스를 생성하여 nginx 80 포트로 인스턴스들을 로드 밸런싱

### 설치순서

<img src="./images/배포구조.png" width="300px">

1. vue 빌드하여 배포 : vue와 node 연동하기
2. node : 클라우드 서버에 Node.js 배포 및 실행
3. pm2 : 프로세스 매니저로 node 서버가 갑자기 꺼져버려도 자동으로 재구동
4. enginx : 프록시 서버 역할

### vue와 node 연동하기

1. Vue를 node에 배포
   node express를 실행했을 때 Vue로 만든 웹프론트도 함께 실행되도록 함.

2. node의 router와 vue의 router를 연결

### node 실행

```sh
# 패키지 업데이트
sudo apt-get update

# nvm 설치
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.1/install.sh | bash

# 로그아웃하고 다시 로그인

# nvm 설치 확인
nvm --verion

# nvm 명령어로 node와 npm을 설치
nvm install 22.14.0

# git clone
git clone https://github.com/cyannara/project.git

# 노드 서버 패키지 설치
cd project/backend
npm i

# 서버 실행

node backend/app.js
node backend/app.js &
node app.js > /dev/null 2>&1 &
node app.js > ~/server.log 2>&1 &
```

브라우저로 서버 연결 확인

```sh
http://54.180.202.222:3000
```

### 백그라운드 실행

로그인한 세션에서 계속 입력을 하기 위해 프로세스를 백그라운드로 실행  
`포그라운드`로 실행할 경우 터미널을 통해 다른 일을 할 수 없음.
`백그라운드 기능`을 사용하면 한 터미널에서 여러 개의 프로세스를 동시에 실행시키고 작업을 할 수 있음.  
부모 프로레스와 세션이 공유되기 때문에 부모프로세스(터미널)를 종료되면 자식인 프로세스에 종료 신호가 전달되어 `같이 종료`됨.  
`데몬`은 백그라운드 프로세스이며 데몬은 터미널을 갖지 않으며 항상 실행될 수 있다.

```sh
# 백그라운드에서 실행 ( & )
$ node app.js > server.log 2>&1 &

# 백그라운드 프로세스 확인(현재 쉘 세션의 작업목록 표시)
$ jobs
[1]+  Running                 node app.js > server.log 2>&1 &

# 백그라운드나 중지된된 프로세스를 포그라운드로 전환
$ fg

node app.js > server.log 2>&1 &   # 출력결과를 파일에 저장
node app.js > /dev/null 2>&1 &    # 출력결과를 안보이게
^Z                                # ^Z : 중지
                                  # ^C : 종료
[1]+  Stopped                 node app.js > server.log 2>&1

# 중지된 작업을 백그라운드에서 계속 실행
$ bg

# 터미널(현재 새션) 닫기
$ exit
```

### nohup

현재 사용자 세션이 아닌 운영체제가 제공하는 백그라운드 공간에서 실행한다. 사용자의 세션이 종료되어도 지금 실행시킨 프로세스는 종료되지 않는다.
&는 로그아웃하거나 ssh 세션, stty 가 끊어지면 그 명령도 종료됨.  
hang up: 데몬처럼 부모프로세스 종료 시 자식 프로세스에게 `hub` 신호를 전달하지 않게 하여 부모프로세스(터미널)이 종료된다 하더라도 자식 프로세스가 종료되지 않게 할 수 있다.
nohup 에 별도 리다이렉션이 없으면 표준출력과 표준에러는 nohup.out 이란 파일에 기록함.

```sh
$ nohup node app.js > server.log 2>&1 &  # 사용자의 세션이 종료되어도 유지되는 프로세스를 백그라운드로 실행한다.
```

### 프로세스 종료

```sh
## 실행중인 프로세스 상태 표시 e: Every  f: Full format
$ ps -ef | grep node
    PID TTY          TIME CMD
  27367 pts/0    00:00:00 node

# 프로세스 종료
$ kill -9 27367
```

### pm2

클러스터 모드: Node.js 부하 분산 및 제로 다운타임 리로드  
https://inpa.tistory.com/entry/node-%F0%9F%93%9A-PM2-모듈-사용법-클러스터-무중단-서비스  
Node JS 프로세서를 관리하는 패키지

- 백그라운드에서 데몬으로 실행이 됨.
- 프로세스 매니저로 node 서버가 갑자기 꺼져버려도 자동으로 재구동도 가능하며 터미널을 끄더라도 서버가 꺼지지 않음.
- Node.js는 싱글 스레드 기반이지만, 멀티 코어 혹은 하이퍼 스레딩을 사용할 수 있게 해준다.
- 클라이언트로부터 요청이 올 때 알아서 요청을 여러 노드 프로세스에 고르게 분배한다.( 로드 밸런싱 )
- 개발할 때 nodemon 을 쓴다면 배포할 때는 pm2를 쓴다.

단점

- 세션을 메모리에 저장하는 경우 메모리를 공유할 수 없음. 세션 메모리가 있는 프로세스로 요청이 가면 로그인된 상태가 되고, 세션 메모리가 없는 프로세스로 요청이 가면 로그인되지 않은 상태가 됨.
- 하나의 프로세스 내에서 돌아가는 멀티 스레드는 메모리를 공유할 수 있지만, 멀티 프로세스는 프로세스간의 메모리 공유를 할 수 없다.
- 단점을 보완하기 위해 세션을 공유할 수 있게 멤캐시드나 `레디스`(redis) 같은 서비스를 사용함.

```sh
# pm2 global(전역 설치) 패키지를 현재 프로젝트가 아닌 시스템의 node_modules에 설치
$ npm install pm2 -g

# 시스템 node_modules 경로 확인
$ npm root -g
/home/ubuntu/.nvm/versions/node/v22.14.0/lib/node_modules

# pm2 버전 확인
$ pm2 --version

# pm2 업데이트
$ pm2 update

# pm2 실행
$ pm2 start app.js

# pm2로 실행중인 프로세스 확인
$ pm2 list

# 프로세스 로그 확인
$ pm2 logs app

# 프로세스 중지
$ pm2 stop app

# 프로세스를 감시하여 리로드하도록 하고 멀티코어로 서버 실행(클러스터 모드)
$ pm2 start app.js --watch -i 2
```

### pm2 실행옵션

| 옵션              | 설명                                                                   | 예시                                   |
| :---------------- | :--------------------------------------------------------------------- | :------------------------------------- |
| --watch           | 실행된 프로젝트의 변경사항을 감지하여 서버를 자동 재시작(reload)       |                                        |
| --ignore-watch    | watch 옵션 사용 시에 특정 폴더 경로는 무시해야 할 때                   |                                        |
| --i max(코어개수) | Node.js의 싱글 스레드를 보완하기 위한 클러스터 모드                    |                                        |
| --name 이름       | 앱 이름 지정                                                           |                                        |
| --log 로그경로    | 로그파일 경로 지정                                                     |                                        |
| scale app +2      | 프로세스 수 증가 또는 감소                                             |                                        |
| status            | 현재 프로세스 리스트트                                                 |                                        |
| ls                |                                                                        |                                        |
| stop              | 프로세스 중지                                                          |                                        |
| restart           | 프로세스 재시작                                                        |                                        |
| reload            | 프로세스 리로드                                                        |                                        |
| delete 2          | 특정 프로세스 중지                                                     |                                        |
| delete app        | 이름이 app인 모든 프로세스 중지                                        |                                        |
| kill              | 프로세스 전체 삭제                                                     |                                        |
| log               | 전체 프로세스 로그 보기                                                | pm2 log                                |
|                   | 특정 프로세스 로그 보기                                                | pm2 log 프로세스이름 또는 프로세스아디 |
|                   | 프로세스 로그 200줄까지만 보기기                                       | pm2 log --lines 200                    |
|                   | 에러 로그 보기                                                         | pm2 log --err 200                      |
| show              | 프로세스 정보                                                          |                                        |
| monit             | 모니터링. 실시간 상태 확인(각 프로세스의 메모리, CPU 사용율, 현재상태) |                                        |

restart와 reload 차이점  
restart는 모든 프로세스를 죽인 다음 다시 시작하는 방식으로 아주 잠깐동안 서비스를 이용하지 못하는 상황이 생길 수 있음.  
reload는 최소한 1개 이상의 프로세스를 유지하며 하나씩 재시작하는 방식으로 재시작 하는 동안 서비스를 이용못하는 상황을 미연에 방지할 수 있음(0-second-downtime). 재실행 속도가 느리다는 단점이 있음.

1024 이하의 포트를 사용하려면 관리자 권한이 필요하므로 sudo 를 붙여서 실행하면 됨.

### nginx 설치

### nvm 으로 노드 설치하기

nvm(node version manager) : 여러 개의 노드 버전을 사용할 수 있는 도구

```sh
# 사용가능한 노드 버전 조회
$ nvm list available

# 사용할 버전의 노드 설치
$ nvm install 10.16.3

# 원하는 노드 버전 지정
$ nvm use 22.14.0

# 설치되어 사용가능한 node 버전 조회
$ nvm list
       v10.16.3
->     v22.14.0

# 설치된 node 버전 확인
node -v

# 로그아웃 후 다시 로그인 하면 node 버전이 이전상태로 돌아가 있음
# node 기본 버전 변경
$ nvm alias default v22.14.0

```

### 이전 명령어 실행 방법

명령어를 수행하면 메모리에 먼저 저장되었다가 log out(log off)시에 .bash_history가 이전에 수행했던 명령어들을 저장한다. 로그아웃 후 다시 접속하더라도 history는 남아 있음.

```sh
$ history   # 이전에 실행했던 명령어 확인
$ !번호     # 이전 명령어 다시 실행
$ echo $HISTSIZE # history 내용 저장 갯수
$ history -c
```

### history 출력 포멧 지정

```sh
$ vi /etc/profile
```

```
# History Command Execute Time
export HISTTIMEFORMAT="%F %T "
```
