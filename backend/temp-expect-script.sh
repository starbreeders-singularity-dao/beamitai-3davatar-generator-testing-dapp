
      #!/usr/bin/expect -f
      spawn scp /Users/thomasheindl/Documents/beamitai01/beamitai/backend/fullbodyimages/1727602116267-fullbody.png content_thomasheindl@35.202.238.239:/dreamgaussian/data
      expect "password:"
      send -- ""
      interact
    