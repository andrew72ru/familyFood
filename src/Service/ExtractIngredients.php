<?php declare(strict_types=1);

namespace App\Service;

use App\Dto\OpenAiResponseDto;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

final readonly class ExtractIngredients
{
    private const string API_URL = 'https://api.openai.com/v1/responses';

    public function __construct(
        private HttpClientInterface $httpClient,
        private SerializerInterface $serializer,
        private LoggerInterface $logger,
        #[Autowire(param: 'env(OPENAI_KEY)')]
        private string $openAiApiKey,
        #[Autowire(param: 'env(OPENAI_EXTRACT_PROMPT)')]
        private string $promptId,
        #[Autowire(param: 'env(OPENAI_EXTRACT_PROMPT_VERSION)')]
        private string $promptVersion,
    ) {
    }

    public function extract(string $recipe): array
    {
        $response = $this->httpClient->request('POST', self::API_URL, [
            'headers' => [
                'Authorization' => 'Bearer ' . $this->openAiApiKey,
                'Content-Type' => 'application/json',
            ],
            'json' => [
                'model' => 'gpt-4.1-mini',
                'prompt' => [
                    'id' => $this->promptId,
                    'version' => $this->promptVersion,
                    'variables' => [
                        'dish' => $recipe,
                    ],
                ],
            ],
        ]);
        $content = $response->getContent();

        $this->logger->info('OpenAI Response', ['response' => \json_decode($content, true)]);

        $data = $this->serializer->deserialize($content, OpenAiResponseDto::class, 'json', [
            'allow_extra_attributes' => true,
        ])->getFirstMessageText();

        try {
            $ingredients = \json_decode($data, true, 512, JSON_THROW_ON_ERROR);
            if (!\is_array($ingredients) || !\array_is_list($ingredients)) {
                throw new \RuntimeException('Decoded JSON is not a list array');
            }
        } catch (\Throwable $e) {
            $this->logger->error(\sprintf('Unable to deserialize a response: %s', $e->getMessage()), ['text' => $data]);

            return [];
        }

        return \array_filter($ingredients);
    }
}
