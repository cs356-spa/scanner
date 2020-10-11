https://verdaccio.org/docs/en/github-actions

wget https://registry.npmjs.org/react-jsonschema-form/-/react-jsonschema-form-1.8.1.tgz
zgrep -F -f strings.txt react-jsonschema-form-1.8.1.tgz

zgrep -a "uiSchema order list contains extraneous " react-jsonschema-form-1.8.1.tgz

comm -12 output/strings-https:--root.treehacks.com-dist-vendors~app.js.txt output/strings-https:--unpkg.com-react-jsonschema-form@1.8.0-dist-react-jsonschema-form.js.txt | wc -l
2019

comm -12 output/strings-https:--root.treehacks.com-dist-vendors~app.js.txt output/strings-https:--unpkg.com-react-jsonschema-form@1.8.1-dist-react-jsonschema-form.js.txt | wc -l
2009

comm -12 output/strings-https:--root.treehacks.com-dist-vendors~app.js.txt output/strings-https:--unpkg.com-@rjsf-core@2.2.0-dist-react-jsonschema-form.js.txt | wc -l
1986

comm -12 output/strings-https:--root.treehacks.com-dist-vendors~app.js.txt output/strings-https:--unpkg.com-lodash@4.17.19-lodash.min.js.txt | wc -l
126

comm -12 output/strings-https:--root.treehacks.com-dist-vendors~app.js.txt output/strings-https:--unpkg.com-lodash@4.17.15-lodash.min.js.txt | wc -l
93



lodash 4.2.0 package / umd file not found undefined
lodash 4.17.9 0.12190472589240345 880
lodash 4.17.5 0.12190472589240345 880
lodash 4.17.4 0.1202410715813462 874
lodash 4.17.3 0.1202410715813462 874
lodash 4.17.20 0.6243060184134314 884
lodash 4.17.2 0.1202410715813462 874
lodash 4.17.19 0.6243060184134314 884
lodash 4.17.18 0.6243060184134314 884
lodash 4.17.17 package / umd file not found undefined
lodash 4.17.16 package / umd file not found undefined
lodash 4.17.15 0.12326140121175276 884
lodash 4.17.14 0.12298319038716383 884
lodash 4.17.13 0.12298319038716383 884
lodash 4.17.12 0.12298319038716383 884
lodash 4.17.11 0.12161266808564589 879
lodash 4.17.10 0.12218537705786037 881
lodash 4.17.1 0.1202410715813462 874
lodash 4.17.0 0.1202410715813462 874
lodash 4.16.6 0.11996937033155937 874
lodash 4.16.5 0.11996937033155937 874
lodash 4.16.4 0.11754091160689434 865
lodash 4.16.3 0.11591536150489525 859
lodash 4.16.2 0.11566424762767247 858
lodash 4.16.1 0.11540819158935015 857
lodash 4.16.0 0.11448781810572088 857
lodash 4.15.0 0.11525848634980052 862
lodash 4.14.2 0.08247095284047466 603
lodash 4.14.1 0.08318397113986796 606
lodash 4.14.0 0.08295378136471057 605
lodash 4.13.1 0.07907313247934415 596
lodash 4.13.0 0.07907313247934415 596
lodash 4.12.0 0.07725362287664174 587
lodash 4.11.2 0.07786425484087942 590
lodash 4.11.1 0.07735192894479492 588
lodash 4.11.0 0.07735192894479492 588
lodash 4.10.0 0.07689866967642132 585