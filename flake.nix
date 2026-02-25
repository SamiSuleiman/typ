{
  description = "typ - font preview/comparison tool";

  outputs =
    { nixpkgs, ... }:
    let
      supportedSystems = [
        "aarch64-linux"
        "aarch64-darwin"
        "x86_64-darwin"
        "x86_64-linux"
      ];
      forAllSystems = nixpkgs.lib.genAttrs supportedSystems;

      # Docker images are always Linux
      linuxSystems = [
        "aarch64-linux"
        "x86_64-linux"
      ];
      forLinuxSystems = nixpkgs.lib.genAttrs linuxSystems;
    in
    {
      devShells = forAllSystems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in
        {
          default = pkgs.mkShell {
            buildInputs = [
              pkgs.nodejs_22
              pkgs.pnpm
              pkgs.git
            ];

            shellHook = ''
              export NODE_ENV=development
            '';
          };
        }
      );

      packages = forLinuxSystems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};

          # The pre-built Angular static assets.
          # Run `pnpm install && pnpm build` before `nix build .#dockerImage`.
          staticFiles = pkgs.runCommand "typ-static" { } ''
            mkdir -p $out/usr/share/nginx/html
            cp -r ${./dist/typ/browser}/* $out/usr/share/nginx/html/
          '';

          nginxConf = pkgs.runCommand "typ-nginx-conf" { } ''
            mkdir -p $out/etc/nginx
            cp ${./nginx.conf} $out/etc/nginx/nginx.conf
          '';
        in
        {
          dockerImage = pkgs.dockerTools.buildLayeredImage {
            name = "mmayss/typ";
            tag = "master";

            contents = [
              pkgs.nginx
              staticFiles
              nginxConf
              # nginx needs a tmp dir and log dir at runtime
              pkgs.dockerTools.fakeNss
            ];

            extraCommands = ''
              mkdir -p tmp
              mkdir -p var/log/nginx
              mkdir -p var/cache/nginx
            '';

            config = {
              Cmd = [
                "nginx"
                "-g"
                "daemon off;"
              ];
              ExposedPorts = {
                "80/tcp" = { };
              };
            };
          };
        }
      );
    };
}
