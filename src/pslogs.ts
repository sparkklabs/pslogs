/* [pslogs] */

// #IMPORTS

    // ##PM2
const PM2 = require('pm2')

// #TYPES

    // ##THIS
type PSLOGS_TT_ARGS = [slackUrl: string, appName?: string]

// #CONSTANTES

    // ##THIS
const
PSLOGS_STATUS_CODE_RGX = /(?:status|code)[\s:=]*(\d{3})[^\d]/gmi
,
PSLOGS_KNOWN_STATUS_CODES = [404, 500]

// #VARIABLES

    // ##THIS
let
pslogsSlackUrl: string,
pslogsAppName : string,
pslogsLastData = ''

// #FUNCTIONS

    // ##SET
function pslogs_set(args: PSLOGS_TT_ARGS): void
{
    pslogs_setVars(args)
    pslogs_setConnection()
}

function pslogs_setVars([slackUrl, appName = 'silent app']: PSLOGS_TT_ARGS): void
{
    pslogsSlackUrl = slackUrl
    pslogsAppName  = appName
}

function pslogs_setConnection(): void
{
    PM2.connect((err: any): void =>
    {
        if (err) return pslogs_error(err)

        PM2.launchBus((err: any, bus: any): void =>
        {
            if (err) return pslogs_error(err)

            pslogs_send('INFO', 'internal', '🎧 STREAM PM2 CONNECTED.')

            bus.on('log:err', pslogs_updateError)
        })
    })
}

    // ##UPDATES
function pslogs_updateError({process, data}: any): void
{
    if (!data) return

    const DATA = typeof data === 'string' ? data : JSON.stringify(data)

    if (DATA === pslogsLastData) return

    const CODES: number[] = []

    let x: RegExpExecArray | null

    while (x = PSLOGS_STATUS_CODE_RGX.exec(DATA))
    {
        const CODE = parseInt(x[1], 10)

        if (isNaN(CODE)) continue

        if (!CODES.includes(CODE)) CODES.push(CODE)
    }

    switch (CODES.length)
    {
        case 0: break
        case 1:
        {
            const CODE = CODES[0]

            if (PSLOGS_KNOWN_STATUS_CODES.includes(CODE))
            {
                if (CODE > 499 && CODE < 600) pslogs_send(CODE, process.name, DATA)

                break
            }
        }
        default: pslogs_send(`UNKNOWN ERROR`, process.name, `{STATUS CODES: ${JSON.stringify(CODES)}} ~ ${DATA}`)
    }

    pslogsLastData = DATA
}

    // ##SHIPMENTS
function pslogs_send(type: string | number, name: string, data: string): void
{
    fetch(pslogsSlackUrl,
    {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify(
        {
            attachments:
            [
                {
                    type : 'mrkdwn',
                    color: '#27AE61',
                    text : `*PSLOGS ~ ${name} &lt;${pslogsAppName}&gt; [${type}]:*`
                },
                {
                    type : 'mrkdwn',
                    color: type === 'INFO' ? '#F7D488' : '#FF4365',
                    text : `\`\`\`${data}\`\`\``
                }
            ]
        })
    })
    .catch(pslogs_error)
}

    // ##RUN
function pslogs_run(...args: PSLOGS_TT_ARGS): void { pslogs_set(args) }

    // ##UTILS
function pslogs_error(err: any): void
{
    console.error('<PSLOGS> [ERROR]:', err)
            
    process.exit(2)
}

// #EXPORTS

    // ##THIS
module.exports = { run: pslogs_run }